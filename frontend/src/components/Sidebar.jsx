import React from 'react';
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
} from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab, user, mode }) {
  const isGVCN = user?.role === 'gvcn';

  const menuItems = [
    { id: 'dashboard', label: 'Tổng quan', icon: LayoutDashboard, badge: null },
    { id: 'attendance', label: 'Điểm danh 30s', icon: CheckSquare, badge: 'Ưu tiên' },
    { id: 'students', label: 'Hồ sơ học sinh', icon: Users, badge: '40 HS' },
    { id: 'discipline', label: 'Nề nếp & Thi đua', icon: Award, phase: 'GĐ 2' },
    { id: 'academics', label: 'Theo dõi Học tập', icon: GraduationCap, phase: 'GĐ 2' },
    ...(isGVCN
      ? [
          { id: 'parents', label: 'Liên hệ Phụ huynh', icon: PhoneCall, phase: 'GĐ 3' },
          { id: 'schedule', label: 'Lịch & Trực nhật', icon: CalendarDays, phase: 'GĐ 3' },
          { id: 'funds', label: 'Quỹ lớp', icon: Wallet, phase: 'GĐ 3' },
          { id: 'reports', label: 'Báo cáo & Xuất file', icon: FileSpreadsheet, phase: 'GĐ 4' },
        ]
      : []),
  ];

  return (
    <>
      {/* Desktop Sidebar (Left side) */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 p-4 space-y-1">
        <div className="px-3 py-2 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
          Phân Hệ Chức Năng
        </div>

        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          const isUpcoming = Boolean(item.phase);

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500 dark:text-slate-400'}`} />
                <span>{item.label}</span>
              </div>

              {item.badge && (
                <span
                  className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${
                    isActive
                      ? 'bg-emerald-500 text-white'
                      : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                  }`}
                >
                  {item.badge}
                </span>
              )}

              {item.phase && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 font-medium">
                  {item.phase}
                </span>
              )}
            </button>
          );
        })}

        <div className="pt-4 mt-auto border-t border-slate-100 dark:border-slate-800">
          <div className="bg-emerald-50 dark:bg-emerald-950/40 p-3 rounded-xl border border-emerald-100 dark:border-emerald-900/50">
            <p className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">
              {mode === 'demo' ? '🧪 Chế độ dùng thử' : '🔒 Dữ liệu trên máy chủ'}
            </p>
            <p className="text-[11px] text-emerald-700/80 dark:text-emerald-400/80 mt-1">
              {mode === 'demo'
                ? 'Dữ liệu chỉ lưu trong trình duyệt này, có thể mất khi xóa dữ liệu trình duyệt.'
                : 'Mọi thay đổi được lưu vào cơ sở dữ liệu; nếu lưu lỗi hệ thống sẽ báo ngay.'}
            </p>
          </div>
        </div>
      </aside>

      {/* Mobile Bottom Navigation (Visible on phones & tablets) */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur border-t border-slate-200 dark:border-slate-800 px-2 py-1.5 flex items-center justify-around shadow-lg">
        {menuItems.slice(0, 5).map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center py-1 px-2 rounded-lg text-[10px] font-medium transition ${
                isActive
                  ? 'text-emerald-600 dark:text-emerald-400 font-bold'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              <Icon className={`w-5 h-5 mb-0.5 ${isActive ? 'stroke-[2.5]' : 'stroke-[1.75]'}`} />
              <span className="truncate max-w-[64px]">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
}

