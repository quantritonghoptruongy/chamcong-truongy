
import React, { useState, useEffect } from 'react';
import { Employee } from '../types';
import { saveEmployee, getEmployees, deleteEmployee } from '../services/storageService';
import { getPublicIP, saveWifiConfig, getWifiConfigs, removeWifiConfig, WifiConfig } from '../services/networkService';
import Camera from '../components/Camera';

interface EnrollmentProps {
  onNotification: (msg: string, type: 'success' | 'error') => void;
}

const Enrollment: React.FC<EnrollmentProps> = ({ onNotification }) => {
  const [name, setName] = useState('');
  const [position, setPosition] = useState('');
  const [avatar, setAvatar] = useState('');
  const [showCamera, setShowCamera] = useState(false);
  const [refresh, setRefresh] = useState(0);
  
  // Wifi Config State
  const [currentIP, setCurrentIP] = useState<string>('Đang tải...');
  const [wifiConfigs, setWifiConfigs] = useState<WifiConfig[]>([]);

  const employees = getEmployees();

  useEffect(() => {
    loadNetworkInfo();
  }, [refresh]);

  const loadNetworkInfo = async () => {
    setWifiConfigs(getWifiConfigs());
    try {
      const ip = await getPublicIP();
      setCurrentIP(ip);
    } catch (e) {
      setCurrentIP('Không xác định');
    }
  };

  const handleCapture = (imageSrc: string) => {
    setAvatar(imageSrc);
    setShowCamera(false);
  };

  const handleSave = () => {
    if (!name || !position || !avatar) {
      onNotification("Vui lòng nhập đủ thông tin và chụp ảnh", 'error');
      return;
    }
    const newEmp: Employee = {
      id: Date.now().toString(),
      name,
      position,
      avatar,
      createdAt: Date.now()
    };
    saveEmployee(newEmp);
    onNotification("Thêm nhân viên thành công", 'success');
    setName('');
    setPosition('');
    setAvatar('');
    setRefresh(p => p + 1);
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Bạn có chắc muốn xóa nhân viên này?")) {
      deleteEmployee(id);
      setRefresh(p => p + 1);
      onNotification("Đã xóa nhân viên", 'success');
    }
  };

  const handleAddWifi = (wifiName: string) => {
    if (!currentIP || currentIP === 'Đang tải...' || currentIP === 'Không xác định') {
      onNotification("Không tìm thấy IP mạng hiện tại", 'error');
      return;
    }
    saveWifiConfig(wifiName, currentIP);
    setRefresh(p => p + 1);
    onNotification(`Đã lưu Wifi ${wifiName} (IP: ${currentIP})`, 'success');
  };

  const handleRemoveWifi = (wifiName: string) => {
    removeWifiConfig(wifiName);
    setRefresh(p => p + 1);
  };

  return (
    <div className="space-y-6">
      
      {/* Network Configuration Section */}
      <div className="bg-gradient-to-br from-indigo-50 to-white p-5 rounded-xl shadow-sm border border-indigo-100">
        <h2 className="text-lg font-bold text-gray-800 mb-2 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2 text-brand-600">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 3v1.5M4.5 8.25H3m18 0h-1.5M4.5 12h1.5m12 0h-1.5m-1.5 3.75h1.5m-6-9h1.5M12 5.25a1.5 1.5 0 011.5 1.5v1.5a1.5 1.5 0 01-1.5 1.5h-1.5a1.5 1.5 0 01-1.5-1.5v-1.5a1.5 1.5 0 011.5-1.5H12zM13.5 10.5h1.5a1.5 1.5 0 011.5 1.5v1.5a1.5 1.5 0 01-1.5 1.5h-1.5a1.5 1.5 0 01-1.5-1.5v-1.5a1.5 1.5 0 011.5-1.5zM5.25 15.75h1.5a1.5 1.5 0 011.5 1.5v1.5a1.5 1.5 0 01-1.5 1.5h-1.5a1.5 1.5 0 01-1.5-1.5v-1.5a1.5 1.5 0 011.5-1.5zM12 15.75h1.5a1.5 1.5 0 011.5 1.5v1.5a1.5 1.5 0 01-1.5 1.5h-1.5a1.5 1.5 0 01-1.5-1.5v-1.5a1.5 1.5 0 011.5-1.5z" />
            </svg>
            Cấu hình Wifi Chấm công
        </h2>
        <p className="text-xs text-gray-500 mb-3">
          Kết nối điện thoại vào Wifi văn phòng, sau đó nhấn nút bên dưới để thiết lập địa chỉ IP hợp lệ cho việc chấm công.
        </p>
        
        <div className="flex items-center justify-between bg-white p-3 rounded-lg border border-gray-200 mb-3">
            <span className="text-xs text-gray-500 font-semibold uppercase">IP Hiện tại của bạn</span>
            <span className="font-mono text-brand-600 font-bold">{currentIP}</span>
        </div>

        <div className="grid grid-cols-2 gap-3">
            <button 
                onClick={() => handleAddWifi('UMP_NCKH')}
                className="bg-blue-600 text-white text-xs font-bold py-2 px-3 rounded-lg shadow-sm hover:bg-blue-700 active:scale-95 transition-all"
            >
                Thiết lập UMP_NCKH
            </button>
             <button 
                onClick={() => handleAddWifi('UMP_GV')}
                className="bg-indigo-600 text-white text-xs font-bold py-2 px-3 rounded-lg shadow-sm hover:bg-indigo-700 active:scale-95 transition-all"
            >
                Thiết lập UMP_GV
            </button>
        </div>

        {wifiConfigs.length > 0 && (
            <div className="mt-4">
                <h3 className="text-xs font-bold text-gray-500 uppercase mb-2">Wifi đã lưu</h3>
                <div className="space-y-2">
                    {wifiConfigs.map(wifi => (
                        <div key={wifi.name} className="flex justify-between items-center bg-green-50 p-2 rounded border border-green-100">
                             <div>
                                <p className="text-sm font-bold text-green-800">{wifi.name}</p>
                                <p className="text-xs text-green-600 font-mono">{wifi.ip}</p>
                             </div>
                             <button onClick={() => handleRemoveWifi(wifi.name)} className="text-red-400 hover:text-red-600">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                                    <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                                </svg>
                             </button>
                        </div>
                    ))}
                </div>
            </div>
        )}
      </div>

      <div className="border-t border-gray-200 my-4"></div>

      {/* Employee Management Section */}
      <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-lg font-bold text-gray-800 mb-4">Thêm nhân viên mới</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Họ và tên</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nguyễn Văn A"
              className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Chức vụ</label>
            <input
              type="text"
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              placeholder="Chuyên viên..."
              className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
            />
          </div>

          <div className="flex items-center space-x-4 mt-2">
            <button
              onClick={() => setShowCamera(true)}
              className="flex-1 py-2 px-4 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200"
            >
              {avatar ? "Chụp lại ảnh" : "Chụp ảnh khuôn mặt"}
            </button>
            {avatar && (
              <img src={avatar} alt="Preview" className="w-10 h-10 rounded-full object-cover ring-2 ring-brand-500" />
            )}
          </div>

          <button
            onClick={handleSave}
            className="w-full py-3 bg-brand-600 text-white rounded-lg font-bold shadow-md shadow-brand-500/30 active:scale-95 transition-transform"
          >
            Lưu Nhân Viên
          </button>
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="font-semibold text-gray-700 px-1">Danh sách ({employees.length})</h3>
        {employees.length === 0 && <p className="text-gray-400 text-sm text-center py-4">Chưa có nhân viên nào.</p>}
        {employees.map(emp => (
          <div key={emp.id} className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <img src={emp.avatar} alt={emp.name} className="w-10 h-10 rounded-full object-cover bg-gray-100" />
              <div>
                <p className="font-bold text-gray-800 text-sm">{emp.name}</p>
                <p className="text-xs text-gray-500">{emp.position}</p>
              </div>
            </div>
            <button onClick={() => handleDelete(emp.id)} className="text-red-500 p-2">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
              </svg>
            </button>
          </div>
        ))}
      </div>

      {showCamera && (
        <Camera
          onCapture={handleCapture}
          onClose={() => setShowCamera(false)}
          instruction="Chụp ảnh rõ mặt để đăng ký"
        />
      )}
    </div>
  );
};

export default Enrollment;
