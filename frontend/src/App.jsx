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
import ClassManageModal from './components/ClassManageModal';

export default function App() {
  const [user, setUser] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('scn_dark_mode') === 'true';
  });

  // Quản lý lớp học
  const [classes, setClasses] = useState([]);
  const [currentClass, setCurrentClass] = useState(null);
  const [showClassModal, setShowClassModal] = useState(false);

  // Đồng bộ class dark lên html element
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('scn_dark_mode', darkMode);
  }, [darkMode]);

  // 'server' | 'demo' (xem api.js). Ở 'demo' dữ liệu chỉ nằm trong trình duyệt nên phải báo rõ.
  const [mode, setMode] = useState(null);

  // Khởi động
  useEffect(() => {
    api.mode().then(setMode);
    checkCurrentUser();
  }, []);

  // Máy chủ báo hết phiên giữa chừng -> về màn hình đăng nhập (không lưu giả)
  useEffect(() => {
    const onUnauthorized = () => setUser(null);
    window.addEventListener('scn:unauthorized', onUnauthorized);
    return () => window.removeEventListener('scn:unauthorized', onUnauthorized);
  }, []);

  // Tải danh sách lớp sau khi đăng nhập. Chỉ GVCN được đổi lớp; vai trò khác chỉ thấy lớp của mình.
  useEffect(() => {
    if (user) loadClasses(user);
  }, [user?.id, user?.role]);

  const loadClasses = async (u) => {
    if (u.role !== 'gvcn') {
      setClasses(u.class ? [u.class] : []);
      setCurrentClass(u.class || null);
      return;
    }
    try {
      const list = await api.classes.list();
      setClasses(list);
      setCurrentClass(list.find((c) => c.is_current) || list[0] || null);
    } catch (e) {
      alert(`Không tải được danh sách lớp: ${e.message}`);
    }
  };

  // Chỉ đổi giao diện sau khi nơi lưu (máy chủ/trình duyệt) đã xác nhận đổi lớp
  const handleSelectClass = async (classId) => {
    try {
      await api.classes.setCurrent(classId);
      const list = await api.classes.list();
      const selected = list.find((c) => c.id === classId);
      setClasses(list);
      if (selected) {
        setCurrentClass(selected);
        setUser((prev) => ({ ...prev, class: selected }));
      }
    } catch (e) {
      alert(`Không đổi được lớp: ${e.message}`);
    }
  };

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
        <p className="text-sm font-medium text-slate-400">Đang khởi động so-chu-nhiem...</p>
      </div>
    );
  }

  // Nếu chưa đăng nhập: hiện màn hình Login
  if (!user) {
    return <LoginView demo={mode === 'demo'} onLoginSuccess={(loggedInUser) => setUser(loggedInUser)} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col transition-colors">
      {/* Thanh điều hướng trên cùng */}
      <Navbar
        user={user}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        onLogout={handleLogout}
        currentClass={currentClass}
        classes={classes}
        onOpenClassModal={user.role === 'gvcn' ? () => setShowClassModal(true) : undefined}
      />

      {mode === 'demo' && (
        <div className="bg-amber-100 dark:bg-amber-950 border-b border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs font-semibold px-4 py-2 text-center">
          ⚠️ Chế độ dùng thử: dữ liệu chỉ lưu trong trình duyệt này, không đồng bộ giữa các thiết bị và sẽ mất khi xóa
          dữ liệu trình duyệt. Không nhập thông tin thật của học sinh.
        </div>
      )}

      {/* Thân ứng dụng: Sidebar + Nội dung */}
      <div className="flex-1 max-w-7xl w-full mx-auto flex">
        {/* Sidebar phân hệ */}
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} user={user} mode={mode} />

        {/* Nội dung chính của màn hình. key=lớp: đổi lớp thì mọi màn hình tải lại dữ liệu từ đầu */}
        <main key={currentClass?.id ?? 'none'} className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0">
          {activeTab === 'dashboard' && (
            <DashboardView
              currentClass={currentClass}
              onNavigateTab={(tab) => setActiveTab(tab)}
              onSelectStudent={(stId) => {
                setSelectedStudentId(stId);
                setActiveTab('students');
              }}
            />
          )}

          {activeTab === 'attendance' && (
            <AttendanceView user={user} currentClass={currentClass} />
          )}

          {activeTab === 'students' && (
            <StudentsView
              user={user}
              currentClass={currentClass}
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
                  Hiện tại hệ thống đã hoàn thành trọn vẹn <strong>Giai đoạn 1 (a)</strong> cho Lớp{' '}
                  <strong>{currentClass?.name || '10A1'}</strong>.
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

      {/* Modal Chọn & Quản lý Lớp */}
      {showClassModal && (
        <ClassManageModal
          classes={classes}
          currentClassId={currentClass?.id}
          onSelectClass={handleSelectClass}
          onClassesUpdated={(updatedList) => {
            setClasses(updatedList);
            setCurrentClass((prev) => updatedList.find((c) => c.id === prev?.id) || prev);
          }}
          onClose={() => setShowClassModal(false)}
        />
      )}
    </div>
  );
}
