import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  CheckSquare,
  Users,
  Award,
  GraduationCap,
  PhoneCall,
  CalendarDays,
  Wallet,
  FileSpreadsheet,
  Construction,
  Sparkles,
} from 'lucide-react';

import { api } from './api';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import DashboardView from './components/DashboardView';
import AttendanceView from './components/AttendanceView';
import StudentsView from './components/StudentsView';
import LoginView from './components/LoginView';

export default function App() {
  const [user, setUser] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('scn_dark_mode') === 'true';
  });

  // Đồng bộ class dark lên html element
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('scn_dark_mode', darkMode);
  }, [darkMode]);

  // Kiểm tra phiên đăng nhập khi tải ứng dụng
  useEffect(() => {
    checkCurrentUser();
  }, []);

  const checkCurrentUser = async () => {
    try {
      setCheckingAuth(true);
      const me = await api.auth.me();
      setUser(me);
    } catch (err) {
      setUser(null);
    } finally {
      setCheckingAuth(false);
    }
  };

  const handleLogout = async () => {
    await api.auth.logout();
    setUser(null);
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-slate-100 space-y-3">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-medium text-slate-400">Đang khởi động Sổ Chủ Nhiệm Điện Tử...</p>
      </div>
    );
  }

  // Nếu chưa đăng nhập: hiện màn hình Login
  if (!user) {
    return <LoginView onLoginSuccess={(loggedInUser) => setUser(loggedInUser)} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col transition-colors">
      {/* Thanh điều hướng trên cùng */}
      <Navbar
        user={user}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        onLogout={handleLogout}
      />

      {/* Thân ứng dụng: Sidebar + Nội dung */}
      <div className="flex-1 max-w-7xl w-full mx-auto flex">
        {/* Sidebar phân hệ */}
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} user={user} />

        {/* Nội dung chính của màn hình */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0">
          {activeTab === 'dashboard' && (
            <DashboardView
              onNavigateTab={(tab) => setActiveTab(tab)}
              onSelectStudent={(stId) => {
                setSelectedStudentId(stId);
                setActiveTab('students');
              }}
            />
          )}

          {activeTab === 'attendance' && <AttendanceView user={user} />}

          {activeTab === 'students' && (
            <StudentsView
              user={user}
              selectedStudentId={selectedStudentId}
              onClearSelectedStudent={() => setSelectedStudentId(null)}
            />
          )}

          {/* Màn hình xem trước cho các Giai đoạn tiếp theo (GĐ 2, 3, 4) */}
          {['discipline', 'academics', 'parents', 'schedule', 'funds', 'reports'].includes(activeTab) && (
            <div className="bg-white dark:bg-slate-800/80 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm text-center space-y-4 max-w-xl mx-auto my-12">
              <div className="w-16 h-16 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 mx-auto flex items-center justify-center">
                <Construction className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950 text-xs font-bold text-emerald-700 dark:text-emerald-300">
                  <Sparkles className="w-3.5 h-3.5" />
                  Kế Hoạch Triển Khai Tiếp Theo
                </div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  {activeTab === 'discipline' && 'Module Nề nếp & Thi đua (Giai đoạn 2)'}
                  {activeTab === 'academics' && 'Module Theo dõi Học tập & ĐTB Thông tư 22 (Giai đoạn 2)'}
                  {activeTab === 'parents' && 'Module Liên hệ Phụ huynh & Sổ tay Zalo/SMS (Giai đoạn 3)'}
                  {activeTab === 'schedule' && 'Module Lịch trình & Trực nhật 4 Tổ (Giai đoạn 3)'}
                  {activeTab === 'funds' && 'Module Quỹ lớp & Thu chi minh bạch (Giai đoạn 3)'}
                  {activeTab === 'reports' && 'Module Báo cáo tự động & Xuất PDF/Excel (Giai đoạn 4)'}
                </h2>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Hiện tại hệ thống đã hoàn thành trọn vẹn <strong>Giai đoạn 1 (a)</strong> gồm: Hồ sơ 40 học sinh, Điểm danh nhanh 30 giây, Dashboard tổng quan 1 phút, chuẩn Thông tư 15/2026/TT-BGDĐT.
                </p>
              </div>
              <div className="pt-2">
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition"
                >
                  Quay lại Tổng quan
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

