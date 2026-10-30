import React from 'react';
import { BookOpen, Moon, Sun, LogOut, ShieldCheck, UserCheck, Users, ChevronDown, School } from 'lucide-react';

export default function Navbar({
  user,
  darkMode,
  setDarkMode,
  onLogout,
  currentClass,
  onOpenClassModal,
}) {
  const getRoleBadge = (role) => {
    switch (role) {
      case 'gvcn':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300">
            <ShieldCheck className="w-3.5 h-3.5" />
            GVCN (Toàn quyền)
          </span>
        );
      case 'student':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300">
            <UserCheck className="w-3.5 h-3.5" />
            Cán bộ lớp
          </span>
        );
      case 'parent':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300">
            <Users className="w-3.5 h-3.5" />
            Phụ huynh
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur border-b border-slate-200 dark:border-slate-800 transition-colors shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Tên phần mềm */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 shrink-0">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base sm:text-lg text-slate-900 dark:text-white tracking-tight">
                  so-chu-nhiem
                </span>
                <span className="hidden md:inline-block px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider rounded bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
                  TT 15/2026/TT-BGDĐT
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium hidden sm:block">
                Sổ Chủ Nhiệm Điện Tử THPT
              </p>
            </div>
          </div>

          {/* Chọn Lớp Học (Class Switcher Button - Nổi bật ở giữa) */}
          <div className="flex items-center">
            <button
              onClick={onOpenClassModal}
              disabled={!onOpenClassModal}
              title={onOpenClassModal ? 'Bấm để chọn lớp hoặc thêm/sửa tên lớp' : 'Lớp của bạn'}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800/80 transition shadow-sm active:scale-95 group disabled:cursor-default disabled:hover:bg-emerald-50 disabled:active:scale-100"
            >
              <School className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <div className="text-left">
                <span className="font-black text-xs sm:text-sm text-emerald-900 dark:text-emerald-200 flex items-center gap-1">
                  Lớp {currentClass?.name || '10A1'}
                  <ChevronDown className="w-3.5 h-3.5 text-emerald-600 group-hover:translate-y-0.5 transition" />
                </span>
              </div>
              <span className="hidden lg:inline text-[10px] px-1.5 py-0.5 rounded bg-emerald-200/60 dark:bg-emerald-800/60 text-emerald-900 dark:text-emerald-100 font-semibold ml-1">
                Đổi lớp
              </span>
            </button>
          </div>

          {/* Hành động bên phải */}
          <div className="flex items-center gap-3">
            {/* Phân quyền người dùng */}
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                {user?.full_name || 'Người dùng'}
              </span>
              <div>{getRoleBadge(user?.role)}</div>
            </div>

            {/* Toggle Dark Mode */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              title={darkMode ? 'Chuyển sang giao diện Sáng' : 'Chuyển sang giao diện Tối'}
              className="p-2 rounded-lg text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition"
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Đăng xuất */}
            <button
              onClick={onLogout}
              title="Đăng xuất"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition border border-rose-200/60 dark:border-rose-900/40"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Đăng xuất</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
