import React, { useEffect, useState } from 'react';
import { Employee, AttendanceRecord } from '../types';
import { getEmployees, saveAttendanceLog } from '../services/storageService';
import { getPublicIP, getWifiConfigs, isWifiConnection } from '../services/networkService';
import { logAttendance } from '../services/attendanceService';
import Camera from '../components/Camera';
import { verifyFace } from '../services/geminiService';

interface DashboardProps {
  onNotification: (msg: string, type: 'success' | 'error') => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onNotification }) => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmpId, setSelectedEmpId] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [time, setTime] = useState(new Date());

  // Face Auth State
  const [showCamera, setShowCamera] = useState(false);
  const [pendingType, setPendingType] = useState<'CHECK_IN' | 'CHECK_OUT' | null>(null);
  const [pendingIP, setPendingIP] = useState('');

  useEffect(() => {
    setEmployees(getEmployees());
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const doAttendance = async (type: 'CHECK_IN' | 'CHECK_OUT') => {
    if (!selectedEmpId) {
      onNotification('Vui lòng chọn nhân viên trước', 'error');
      return;
    }

    setIsProcessing(true);
    setStatusMessage('Đang kiểm tra kết nối Wifi/IP...');

    try {
      // 1. Wifi Logic
      if (!isWifiConnection()) {
        console.warn('Có thể đang dùng 4G/5G, sẽ kiểm tra IP.');
      }

      const wifiConfigs = getWifiConfigs();
      let currentIP = '';

      if (wifiConfigs.length > 0) {
        currentIP = await getPublicIP();
        const ok = wifiConfigs.some((c) => c.ip === currentIP);
        if (!ok) {
          const names = wifiConfigs.map((c) => c.name).join(' hoặc ');
          throw new Error(`Vui lòng kết nối Wifi: ${names}. IP hiện tại (${currentIP}) không hợp lệ.`);
        }
      } else {
        try { currentIP = await getPublicIP(); } catch { }
      }

      // Check Config
      const isFaceEnabled = localStorage.getItem('ENABLE_FACE_ATTENDANCE') === 'true';

      if (isFaceEnabled) {
        // Chuyển sang flow chụp ảnh
        setPendingType(type);
        setPendingIP(currentIP);
        setShowCamera(true);
        setIsProcessing(false); // Tạm dừng loading để hiện camera
        return;
      }

      // Flow cũ (Wifi Only)
      await submitAttendance(type, currentIP, 'Wifi/IP Only', 1, '');

    } catch (err: any) {
      onNotification(err?.message || 'Lỗi chấm công', 'error');
      setIsProcessing(false);
    }
  };

  const handleFaceCapture = async (imageSrc: string) => {
    setShowCamera(false);
    setIsProcessing(true);
    setStatusMessage('Đang phân tích khuôn mặt...');

    try {
      if (!pendingType || !selectedEmpId) throw new Error('Mất trạng thái chấm công.');

      const employee = employees.find(e => e.id === selectedEmpId);
      if (!employee || !employee.avatar) {
        throw new Error('Nhân viên chưa đăng ký khuôn mặt (hoặc không tìm thấy).');
      }

      // verify
      const result = await verifyFace(employee.avatar, imageSrc);

      if (!result.isMatch) {
        throw new Error(`Khuôn mặt không khớp! (${result.reasoning})`);
      }

      // Success
      await submitAttendance(pendingType, pendingIP, `Face Auth (Conf: ${result.confidence})`, result.confidence, imageSrc);

    } catch (err: any) {
      onNotification(err?.message || 'Lỗi nhận diện', 'error');
    } finally {
      setIsProcessing(false);
      setPendingType(null);
    }
  };

  const submitAttendance = async (type: 'CHECK_IN' | 'CHECK_OUT', ip: string, note: string, confidence: number, snapshot: string) => {
    const employee = employees.find((e) => e.id === selectedEmpId);
    if (!employee) throw new Error('Không tìm thấy nhân viên');

    const now = Date.now();
    const record: AttendanceRecord = {
      id: now.toString(),
      employeeId: employee.id,
      employeeName: employee.name,
      timestamp: now,
      type,
      confidence,
      status: 'SUCCESS',
      snapshot,
    };
    saveAttendanceLog(record);

    await logAttendance({
      employeeId: employee.id,
      employeeName: employee.name,
      status: type,
      note: `${note}${ip ? ` - IP: ${ip}` : ''}`,
      ip: ip,
    });

    onNotification(
      `Thành công! ${type === 'CHECK_IN' ? 'Vào ca' : 'Ra ca'}`,
      'success'
    );
    setIsProcessing(false);
  };

  const currentEmployee = employees.find((e) => e.id === selectedEmpId);

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-brand-600 to-brand-700 rounded-2xl p-6 text-white shadow-lg shadow-brand-500/30">
        <div className="flex flex-col items-center">
          <span className="text-sm font-medium opacity-80 uppercase tracking-wider">
            {time.toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long' })}
          </span>
          <span className="text-4xl font-bold mt-2 tabular-nums">
            {time.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>

      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <label className="block text-xs font-semibold text-gray-500 mb-2 uppercase">Chọn Nhân Viên</label>
        <select
          value={selectedEmpId}
          onChange={(e) => setSelectedEmpId(e.target.value)}
          className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 transition-shadow appearance-none"
        >
          <option value="">-- Chọn tên của bạn --</option>
          {employees.map((emp) => (
            <option key={emp.id} value={emp.id}>
              {emp.name} - {emp.position}
            </option>
          ))}
        </select>

        {currentEmployee && (
          <div className="mt-4 flex items-center space-x-3 bg-blue-50 p-3 rounded-lg">
            {currentEmployee.avatar ? (
              <img src={currentEmployee.avatar} alt="avatar" className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm" />
            ) : (
              <div className="w-12 h-12 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-400 text-xs">
                NV
              </div>
            )}
            <div>
              <p className="text-sm font-bold text-gray-800">{currentEmployee.name}</p>
              <p className="text-xs text-gray-500">{currentEmployee.position}</p>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={() => doAttendance('CHECK_IN')}
          disabled={isProcessing || !selectedEmpId}
          className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center space-y-3 disabled:opacity-50 active:scale-95 transition-all"
        >
          <span className="font-semibold text-gray-700">Vào ca</span>
        </button>

        <button
          onClick={() => doAttendance('CHECK_OUT')}
          disabled={isProcessing || !selectedEmpId}
          className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center space-y-3 disabled:opacity-50 active:scale-95 transition-all"
        >
          <span className="font-semibold text-gray-700">Ra ca</span>
        </button>
      </div>

      {isProcessing && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center flex-col space-y-4 px-8 text-center">
          <div className="w-12 h-12 border-4 border-white rounded-full animate-spin"></div>
          <p className="text-white font-medium animate-pulse">{statusMessage}</p>
        </div>
      )}

      {showCamera && (
        <Camera
          onCapture={handleFaceCapture}
          onClose={() => {
            setShowCamera(false);
            setIsProcessing(false);
          }}
          instruction="Đặt khuôn mặt vào khung"
        />
      )}
    </div>
  );
};

export default Dashboard;
