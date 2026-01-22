import React, { useState, useEffect, useMemo } from 'react';
import { getAttendanceLogs } from '../services/storageService';
import { AttendanceRecord } from '../types';

const History: React.FC = () => {
  const [logs, setLogs] = useState<AttendanceRecord[]>([]);
  
  // Default to today and 30 days ago initially, or first day of current month
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(1); // First day of current month
    return formatDateForInput(d);
  });
  
  const [endDate, setEndDate] = useState(() => {
    return formatDateForInput(new Date());
  });

  // Helper to format Date to YYYY-MM-DD (Local time)
  function formatDateForInput(date: Date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  useEffect(() => {
    // Load logs and sort by timestamp desc
    const data = getAttendanceLogs().sort((a, b) => b.timestamp - a.timestamp);
    setLogs(data);
  }, []);

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const logDateStr = formatDateForInput(new Date(log.timestamp));
      return logDateStr >= startDate && logDateStr <= endDate;
    });
  }, [logs, startDate, endDate]);

  const handleExport = () => {
    if (filteredLogs.length === 0) return;

    // CSV Header
    const headers = ["Mã NV", "Họ tên", "Ngày", "Giờ", "Loại", "Trạng thái", "Độ chính xác"];
    
    // CSV Rows
    const rows = filteredLogs.map(log => {
        const d = new Date(log.timestamp);
        const dateStr = d.toLocaleDateString('vi-VN');
        const timeStr = d.toLocaleTimeString('vi-VN');
        
        return [
            log.employeeId,
            `"${log.employeeName}"`, // Quote to handle special characters
            dateStr,
            timeStr,
            log.type === 'CHECK_IN' ? 'Vào ca' : 'Ra ca',
            log.status === 'SUCCESS' ? 'Thành công' : 'Thất bại',
            `${Math.round(log.confidence * 100)}%`
        ].join(",");
    });

    // Add BOM for Excel compatibility with UTF-8
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" 
        + [headers.join(","), ...rows].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Bang_Cham_Cong_${startDate}_den_${endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      {/* Header & Actions */}
      <div className="flex items-center justify-between sticky top-0 bg-gray-50 py-2 z-10">
          <h2 className="font-bold text-gray-800 text-lg">Lịch sử hoạt động</h2>
          <button 
            onClick={handleExport}
            disabled={filteredLogs.length === 0}
            className="flex items-center space-x-1 bg-green-600 text-white px-3 py-2 rounded-lg text-xs font-bold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            <span>Xuất Excel</span>
          </button>
      </div>

      {/* Date Filter */}
      <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Từ ngày</label>
            <input 
                type="date" 
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="w-full text-sm p-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Đến ngày</label>
            <input 
                type="date" 
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className="w-full text-sm p-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all"
            />
          </div>
      </div>

      {/* List */}
      {filteredLogs.length === 0 ? (
         <div className="flex flex-col items-center justify-center py-10 text-gray-400 space-y-2">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10 opacity-50">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm">Không tìm thấy dữ liệu trong khoảng thời gian này.</p>
         </div>
      ) : (
        <div className="space-y-3 pb-4">
           {filteredLogs.map(log => (
             <div key={log.id} className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 flex space-x-3 animate-fade-in-up">
                {/* Snapshot Thumbnail */}
                <div className="w-14 h-14 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden relative group">
                    <img src={log.snapshot} alt="snap" className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                    <div className={`absolute bottom-0 left-0 right-0 h-1 ${log.status === 'SUCCESS' ? 'bg-green-500' : 'bg-red-500'}`} />
                </div>
                
                {/* Info */}
                <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <div className="flex justify-between items-start mb-0.5">
                        <p className="text-sm font-bold text-gray-900 truncate pr-2">{log.employeeName}</p>
                        <span className="text-[10px] text-gray-400 flex-shrink-0 bg-gray-50 px-1.5 py-0.5 rounded">
                            {new Date(log.timestamp).toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'})}
                        </span>
                    </div>
                    <div className="flex justify-between items-end">
                        <p className="text-xs text-gray-500">
                            {new Date(log.timestamp).toLocaleDateString('vi-VN', {day: '2-digit', month: '2-digit', year: 'numeric'})}
                        </p>
                        
                        <div className="flex items-center space-x-2">
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                                log.type === 'CHECK_IN' 
                                ? 'bg-green-50 text-green-700 border border-green-100' 
                                : 'bg-orange-50 text-orange-700 border border-orange-100'
                            }`}>
                                {log.type === 'CHECK_IN' ? 'Vào ca' : 'Ra ca'}
                            </span>
                        </div>
                    </div>
                </div>
             </div>
           ))}
        </div>
      )}
    </div>
  )
}
export default History;