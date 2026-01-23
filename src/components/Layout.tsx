import React from 'react';
import Navigation from './Navigation';
import { ViewState } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  currentView: ViewState;
  setView: (view: ViewState) => void;
  title: string;
}

const Layout: React.FC<LayoutProps> = ({ children, currentView, setView, title }) => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-900">
      {/* Top Header */}
      <header className="bg-white shadow-sm sticky top-0 z-30 px-4 h-14 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-2">
          <div><img src="https://med.ump.edu.vn/html/images/logo_khoaY.png" /></div>
            
            <div>
                <h1 className="text-sm font-bold text-gray-800 leading-tight">Phòng QTTH</h1>
                <p className="text-xs text-gray-500">{title}</p>
            </div>
        </div>
        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-gray-500">
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
            </svg>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 p-4 pb-24 overflow-y-auto">
        {children}

        {/* Author Info Footer */}
        <div className="mt-10 mb-2 py-6 border-t border-gray-200/60 text-center opacity-80">
            <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-2 font-medium">Update bởi</p>
            <p className="text-xs font-bold text-brand-800 mb-0.5">Phòng Quản trị Tổng hợp</p>
            <p className="text-[10px] text-gray-600 font-medium">Trường Y</p>
            <p className="text-[10px] text-gray-500">Đại học Y Dược TPHCM</p>
        </div>
      </main>

      {/* Navigation */}
      <Navigation currentView={currentView} setView={setView} />
    </div>
  );
};

export default Layout;
