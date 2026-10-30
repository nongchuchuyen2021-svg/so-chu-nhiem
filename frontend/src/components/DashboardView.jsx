import React, { useState, useEffect } from 'react';
import {
  Users,
  UserCheck,
  UserX,
  Clock,
  AlertTriangle,
  ArrowRight,
  PhoneCall,
  Calendar,
  Sparkles,
  TrendingUp,
  ShieldAlert,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { api } from '../api';

export default function DashboardView({ onNavigateTab, onSelectStudent, currentClass }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadDashboard();
  }, [currentClass?.id]);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.dashboard.get();
      setData(res);
    } catch (err) {
      console.error('Lỗi tải dashboard:', err);
      setError(err.message || 'Không thể tải dữ liệu bảng điều khiển');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[450px] space-y-3">
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm text-slate-500 font-medium">Đang tải thông tin lớp học...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 rounded-2xl text-center space-y-3">
        <AlertTriangle className="w-8 h-8 text-rose-500 mx-auto" />
        <p className="text-sm font-semibold text-rose-800 dark:text-rose-200">{error}</p>
        <button
          onClick={loadDashboard}
          className="px-4 py-2 bg-rose-600 text-white rounded-xl text-sm font-medium hover:bg-rose-700 transition"
        >
          Thử lại
        </button>
      </div>
    );
  }

  const today = data?.today || {};
  const total = data?.total_students || 0;
  const flagged = data?.flagged_students || [];
  const events = data?.upcoming_events || [];
  const chartData = data?.chart_data || [];

  return (
    <div className="space-y-6 pb-20 lg:pb-8">
      {/* Banner chào mừng & Thông tư 15 */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-sky-700 p-6 text-white shadow-lg shadow-emerald-900/10">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur text-xs font-semibold text-emerald-100 mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              Nắm trọn tình hình lớp trong 1 phút
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
              Tình hình lớp hôm nay • {today.date} ({today.session_label})
            </h1>
            <p className="text-sm text-emerald-100 max-w-2xl">
              Hệ thống Sổ chủ nhiệm điện tử chuẩn quy định <strong>Thông tư 15/2026/TT-BGDĐT</strong> và đánh giá học sinh <strong>Thông tư 22</strong>.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigateTab('attendance')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-emerald-800 hover:bg-emerald-50 font-bold text-sm shadow-md transition transform active:scale-95"
            >
              <span>⚡ Điểm danh ngay</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Trang trí nền */}
        <div className="absolute right-0 bottom-0 translate-x-10 translate-y-10 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
      </div>

      {/* 4 Thẻ Số Liệu Quick Glance */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Hiện diện */}
        <div className="bg-white dark:bg-slate-800/80 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Hiện diện hôm nay</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 dark:text-white">
              {today.present}
            </span>
            <span className="text-xs text-slate-400">/ {total} học sinh</span>
          </div>
          <div className="mt-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" />
            Đạt {today.rate}% sĩ số
          </div>
        </div>

        {/* Vắng mặt */}
        <div className="bg-white dark:bg-slate-800/80 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Vắng mặt</span>
            <div className="w-8 h-8 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <UserX className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-rose-600 dark:text-rose-400">
              {(today.absent_p || 0) + (today.absent_k || 0)}
            </span>
            <span className="text-xs text-slate-400">em</span>
          </div>
          <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            {today.absent_p || 0} có phép • <span className="text-rose-600 font-semibold">{today.absent_k || 0} không phép</span>
          </div>
        </div>

        {/* Đi muộn */}
        <div className="bg-white dark:bg-slate-800/80 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Đi học muộn</span>
            <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-amber-600 dark:text-amber-400">
              {today.late || 0}
            </span>
            <span className="text-xs text-slate-400">em</span>
          </div>
          <div className="mt-2 text-xs text-amber-600 dark:text-amber-400 font-medium">
            Cần nhắc nhở nề nếp
          </div>
        </div>

        {/* Học sinh cần quan tâm */}
        <div className="bg-white dark:bg-slate-800/80 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">HS cần quan tâm</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
              {flagged.length}
            </span>
            <span className="text-xs text-slate-400">em gắn cờ</span>
          </div>
          <div className="mt-2 text-xs text-indigo-600 dark:text-indigo-400 font-medium">
            Theo dõi đặc biệt
          </div>
        </div>
      </div>

      {/* Hàng 2: Biểu đồ chuyên cần tuần + Danh sách vắng hôm nay */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Biểu đồ chuyên cần */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800/80 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Biểu đồ chuyên cần 7 ngày qua
              </h2>
              <p className="text-xs text-slate-500">Tỷ lệ học sinh đi học đầy đủ theo từng ngày</p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
              Chỉ tiêu ≥ 98%
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#94a3b833" />
                <XAxis dataKey="day" tick={{ fontSize: 12 }} stroke="#64748b" />
                <YAxis domain={[30, 40]} tick={{ fontSize: 12 }} stroke="#64748b" />
                <Tooltip
                  formatter={(value, name) => {
                    if (name === 'co_mat') return [`${value} em`, 'Có mặt'];
                    if (name === 'vang') return [`${value} em`, 'Vắng'];
                    if (name === 'muon') return [`${value} em`, 'Đi muộn'];
                    return [value, name];
                  }}
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    borderRadius: '0.75rem',
                    color: '#fff',
                    border: 'none',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="co_mat" name="co_mat" fill="#10b981" radius={[6, 6, 0, 0]} />
                <Bar dataKey="vang" name="vang" fill="#f43f5e" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Danh sách vắng/muộn hôm nay */}
        <div className="bg-white dark:bg-slate-800/80 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Vắng / Muộn hôm nay
              </h2>
              <p className="text-xs text-slate-500">Cần liên hệ gia đình xác nhận</p>
            </div>
            <span className="text-xs font-bold text-rose-600 bg-rose-50 dark:bg-rose-950/60 px-2 py-0.5 rounded-full">
              {today.absent_list?.length || 0} em
            </span>
          </div>

          <div className="mt-3 flex-1 overflow-y-auto space-y-2.5 max-h-[220px]">
            {today.absent_list && today.absent_list.length > 0 ? (
              today.absent_list.map((st) => (
                <div
                  key={st.id}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs"
                >
                  <div className="space-y-0.5">
                    <p className="font-bold text-slate-900 dark:text-white">{st.name}</p>
                    <div className="flex items-center gap-1.5 text-slate-500">
                      <span
                        className={`font-semibold ${
                          st.status === 'K'
                            ? 'text-rose-600'
                            : st.status === 'P'
                            ? 'text-amber-600'
                            : 'text-orange-500'
                        }`}
                      >
                        {st.status_label}
                        {st.minutes_late ? ` (${st.minutes_late}p)` : ''}
                      </span>
                      <span>•</span>
                      <span className="truncate max-w-[140px]">{st.reason || 'Chưa rõ lý do'}</span>
                    </div>
                  </div>

                  {st.phone && st.phone !== '***' && (
                    <a
                      href={`tel:${st.phone}`}
                      className="p-2 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-300 transition"
                      title={`Gọi phụ huynh: ${st.phone}`}
                    >
                      <PhoneCall className="w-4 h-4" />
                    </a>
                  )}
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center h-full py-8 text-center text-slate-400">
                <UserCheck className="w-8 h-8 text-emerald-500 mb-1" />
                <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                  Lớp đi học đầy đủ 100%!
                </p>
                <p className="text-[11px] text-slate-400">Không có em nào vắng hoặc đi muộn hôm nay.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Hàng 3: Học sinh Cần Quan Tâm + Lịch Sắp Tới */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Học sinh cần quan tâm */}
        <div className="bg-white dark:bg-slate-800/80 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-indigo-600" />
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Học sinh cần quan tâm & hỗ trợ
                </h2>
                <p className="text-xs text-slate-500">Diện chính sách, nề nếp hoặc hoàn cảnh đặc biệt</p>
              </div>
            </div>
            <button
              onClick={() => onNavigateTab('students')}
              className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
            >
              Xem tất cả →
            </button>
          </div>

          <div className="space-y-2">
            {flagged.map((st) => (
              <div
                key={st.id}
                onClick={() => onSelectStudent && onSelectStudent(st.id)}
                className="p-3 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 flex items-center justify-between cursor-pointer hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-900 dark:text-white">
                      {st.name}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium">
                      {st.gender}
                    </span>
                    {st.role !== 'Thành viên' && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-semibold">
                        {st.role}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-indigo-700 dark:text-indigo-300 font-medium">
                    ⚠️ {st.reason}
                  </p>
                </div>

                <div className="text-xs text-slate-400 flex items-center gap-1 font-medium">
                  Chi tiết <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Lịch & Sự kiện sắp đến hạn */}
        <div className="bg-white dark:bg-slate-800/80 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-teal-600" />
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Việc & Sự kiện sắp tới
                </h2>
                <p className="text-xs text-slate-500">Kế hoạch tuần & hoạt động nhà trường</p>
              </div>
            </div>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-300">
              {events.length} sự kiện
            </span>
          </div>

          <div className="space-y-2.5">
            {events.map((ev) => (
              <div
                key={ev.id}
                className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 flex items-start justify-between gap-3"
              >
                <div className="space-y-1">
                  <p className="text-xs font-bold text-slate-900 dark:text-white">
                    {ev.title}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">{ev.note}</p>
                </div>
                <div className="flex flex-col items-end shrink-0">
                  <span className="text-[11px] font-bold text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/60 px-2 py-0.5 rounded-md">
                    {ev.date}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

