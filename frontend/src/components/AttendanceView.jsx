import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Sun,
  Sunset,
  CheckCircle2,
  AlertCircle,
  Clock,
  Filter,
  Save,
  Check,
  PhoneCall,
  AlertTriangle,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { api } from '../api';

const STATUS_CONFIG = {
  C: {
    label: 'Có mặt',
    short: 'C',
    color: 'bg-emerald-500 text-white hover:bg-emerald-600',
    border: 'border-emerald-300 dark:border-emerald-700 bg-emerald-50/40 dark:bg-emerald-950/20',
    icon: CheckCircle2,
    badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300',
  },
  P: {
    label: 'Có phép',
    short: 'P',
    color: 'bg-amber-500 text-white hover:bg-amber-600',
    border: 'border-amber-300 dark:border-amber-700 bg-amber-50/50 dark:bg-amber-950/20',
    icon: AlertCircle,
    badge: 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300',
  },
  K: {
    label: 'Không phép',
    short: 'K',
    color: 'bg-rose-600 text-white hover:bg-rose-700',
    border: 'border-rose-400 dark:border-rose-700 bg-rose-50/60 dark:bg-rose-950/30',
    icon: AlertTriangle,
    badge: 'bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-300',
  },
  M: {
    label: 'Đi muộn',
    short: 'M',
    color: 'bg-orange-500 text-white hover:bg-orange-600',
    border: 'border-orange-300 dark:border-orange-700 bg-orange-50/50 dark:bg-orange-950/20',
    icon: Clock,
    badge: 'bg-orange-100 text-orange-800 dark:bg-orange-900/60 dark:text-orange-300',
  },
};

const COMMON_REASONS = [
  'Ốm / Sốt xin nghỉ',
  'Việc gia đình',
  'Hỏng xe giữa đường',
  'Thời tiết xấu / Mưa ngập',
  'Không rõ lý do (Chưa liên lạc được)',
];

export default function AttendanceView({ user }) {
  const getTodayStr = () => new Date().toISOString().split('T')[0];

  const [targetDate, setTargetDate] = useState(getTodayStr());
  const [session, setSession] = useState(new Date().getHours() < 12 ? 'sang' : 'chieu');
  const [selectedGroup, setSelectedGroup] = useState('all');
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [summary, setSummary] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  useEffect(() => {
    loadAttendance();
  }, [targetDate, session]);

  useEffect(() => {
    loadSummary();
  }, []);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const loadAttendance = async () => {
    try {
      setLoading(true);
      const res = await api.attendance.get(targetDate, session);
      setRecords(res);
    } catch (err) {
      console.error('Lỗi tải điểm danh:', err);
      showToast('⚠️ Không thể tải danh sách điểm danh');
    } finally {
      setLoading(false);
    }
  };

  const loadSummary = async () => {
    try {
      const res = await api.attendance.summary(30);
      setSummary(res);
    } catch (err) {
      console.error('Lỗi tải tóm tắt:', err);
    }
  };

  // 1-Chạm Xoay Vòng Trạng Thái: C -> P -> K -> M -> C
  const cycleStatus = (studentId) => {
    setRecords((prev) =>
      prev.map((r) => {
        if (r.student_id !== studentId) return r;
        let nextStatus = 'C';
        let defaultReason = r.reason;
        let defaultMinutes = r.minutes_late;

        if (r.status === 'C') {
          nextStatus = 'P';
          if (!defaultReason) defaultReason = 'Có phép';
        } else if (r.status === 'P') {
          nextStatus = 'K';
          defaultReason = 'Không phép';
        } else if (r.status === 'K') {
          nextStatus = 'M';
          defaultReason = 'Đi muộn';
          defaultMinutes = defaultMinutes || 10;
        } else if (r.status === 'M') {
          nextStatus = 'C';
          defaultReason = '';
          defaultMinutes = 0;
        }

        return {
          ...r,
          status: nextStatus,
          reason: defaultReason,
          minutes_late: defaultMinutes,
        };
      })
    );
  };

  // Nút Tất Cả Có Mặt
  const setAllPresent = () => {
    setRecords((prev) =>
      prev.map((r) => ({
        ...r,
        status: 'C',
        reason: '',
        minutes_late: 0,
      }))
    );
    showToast('🟢 Đã đánh dấu tất cả có mặt!');
  };

  // Cập nhật lý do hoặc số phút
  const updateDetail = (studentId, field, val) => {
    setRecords((prev) =>
      prev.map((r) => (r.student_id === studentId ? { ...r, [field]: val } : r))
    );
  };

  // Lưu điểm danh
  const handleSave = async () => {
    try {
      setSaving(true);
      const payload = records.map((r) => ({
        student_id: r.student_id,
        status: r.status,
        reason: r.reason || '',
        minutes_late: r.minutes_late || 0,
      }));
      await api.attendance.save(targetDate, session, payload);
      showToast('✅ Đã lưu điểm danh thành công!');
      loadSummary();
    } catch (err) {
      console.error('Lỗi lưu điểm danh:', err);
      showToast(`❌ Lưu thất bại: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  // Thống kê nhanh danh sách hiện tại
  const total = records.length;
  const presentCount = records.filter((r) => r.status === 'C').length;
  const absentPCount = records.filter((r) => r.status === 'P').length;
  const absentKCount = records.filter((r) => r.status === 'K').length;
  const lateCount = records.filter((r) => r.status === 'M').length;
  const rate = total > 0 ? Math.round((presentCount / total) * 100) : 100;

  // Lọc theo tổ
  const filteredRecords = records.filter((r) => {
    if (selectedGroup === 'all') return true;
    return r.group_name === selectedGroup;
  });

  // Tìm các em có nguy cơ vắng >= 3 buổi từ summary
  const atRiskStudentIds = new Set(
    (summary?.at_risk_students || []).map((s) => s.student_id)
  );

  return (
    <div className="space-y-6 pb-24 lg:pb-8">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-4 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 text-sm font-semibold animate-bounce border border-slate-700">
          <Sparkles className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Thanh Điều Khiển Đầu Trang (Sticky on Mobile) */}
      <div className="bg-white dark:bg-slate-800/90 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <CheckCircle2 className="w-6 h-6 text-emerald-500" />
              Điểm Danh Lớp Siêu Tốc
            </h1>
            <p className="text-xs text-slate-500">
              1-Chạm để xoay vòng trạng thái. Thao tác hoàn tất trong dưới 30 giây.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={setAllPresent}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 transition active:scale-95"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Tất cả có mặt
            </button>

            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold bg-emerald-600 text-white hover:bg-emerald-700 shadow-md shadow-emerald-600/20 transition active:scale-95 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Đang lưu...' : 'Lưu Điểm Danh'}</span>
            </button>
          </div>
        </div>

        {/* Thanh chọn ngày, buổi, lọc tổ */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-100 dark:border-slate-700/80">
          {/* Chọn ngày */}
          <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-900/60 px-3 py-2 rounded-xl border border-slate-200/70 dark:border-slate-700">
            <Calendar className="w-4 h-4 text-slate-400" />
            <input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="bg-transparent text-xs font-semibold text-slate-800 dark:text-slate-200 outline-none w-full cursor-pointer"
            />
          </div>

          {/* Chọn buổi */}
          <div className="flex rounded-xl bg-slate-100 dark:bg-slate-900 p-1 border border-slate-200/70 dark:border-slate-700">
            <button
              onClick={() => setSession('sang')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-bold transition ${
                session === 'sang'
                  ? 'bg-white dark:bg-slate-800 text-amber-600 dark:text-amber-400 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
              }`}
            >
              <Sun className="w-3.5 h-3.5" />
              Buổi Sáng
            </button>
            <button
              onClick={() => setSession('chieu')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-bold transition ${
                session === 'chieu'
                  ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
              }`}
            >
              <Sunset className="w-3.5 h-3.5" />
              Buổi Chiều
            </button>
          </div>

          {/* Lọc theo Tổ */}
          <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-900/60 px-3 py-2 rounded-xl border border-slate-200/70 dark:border-slate-700">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={selectedGroup}
              onChange={(e) => setSelectedGroup(e.target.value)}
              className="bg-transparent text-xs font-semibold text-slate-800 dark:text-slate-200 outline-none w-full cursor-pointer"
            >
              <option value="all" className="dark:bg-slate-900">Toàn bộ lớp ({total} HS)</option>
              <option value="Tổ 1" className="dark:bg-slate-900">Tổ 1</option>
              <option value="Tổ 2" className="dark:bg-slate-900">Tổ 2</option>
              <option value="Tổ 3" className="dark:bg-slate-900">Tổ 3</option>
              <option value="Tổ 4" className="dark:bg-slate-900">Tổ 4</option>
            </select>
          </div>
        </div>

        {/* Thanh Thống Kê Nhanh (Pills) */}
        <div className="flex flex-wrap items-center gap-2 text-xs pt-1">
          <span className="font-bold text-slate-700 dark:text-slate-300">
            Sĩ số hiện tại:
          </span>
          <span className="px-2.5 py-1 rounded-lg font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
            🟢 Có mặt: {presentCount} ({rate}%)
          </span>
          <span className="px-2.5 py-1 rounded-lg font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
            🟡 Có phép (P): {absentPCount}
          </span>
          <span className="px-2.5 py-1 rounded-lg font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
            🔴 Không phép (K): {absentKCount}
          </span>
          <span className="px-2.5 py-1 rounded-lg font-bold bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300">
            🟠 Đi muộn (M): {lateCount}
          </span>
        </div>
      </div>

      {/* Cảnh báo học sinh vắng >= 3 buổi */}
      {summary && summary.at_risk_count > 0 && (
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1 text-xs">
            <p className="font-bold text-amber-900 dark:text-amber-200">
              Cảnh báo chuyên cần: Có {summary.at_risk_count} học sinh đã vắng từ 3 buổi trở lên trong tháng!
            </p>
            <p className="text-amber-800/80 dark:text-amber-300/80">
              Các em: {summary.at_risk_students.map((s) => `${s.name} (${s.total_absent} buổi)`).join(', ')}. GVCN cần theo dõi và gửi thông báo cho gia đình theo quy định Thông tư 15.
            </p>
          </div>
        </div>
      )}

      {/* Danh Sách Thẻ Học Sinh Dạng Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[300px] space-y-3">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs text-slate-500 font-medium">Đang tải danh sách học sinh...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3.5">
          {filteredRecords.map((r, idx) => {
            const config = STATUS_CONFIG[r.status] || STATUS_CONFIG.C;
            const isAtRisk = atRiskStudentIds.has(r.student_id);

            return (
              <div
                key={r.student_id}
                className={`p-3.5 rounded-2xl border transition-all duration-200 shadow-sm flex flex-col justify-between gap-3 ${config.border}`}
              >
                {/* Phần trên: Thông tin học sinh */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-700 dark:text-slate-200 shrink-0">
                      {idx + 1}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="font-bold text-sm text-slate-900 dark:text-white truncate">
                          {r.student_name}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                        <span>{r.group_name || 'Lớp'}</span>
                        {isAtRisk && (
                          <span
                            title="Đã vắng từ 3 buổi trở lên trong tháng"
                            className="px-1.5 py-0.2 rounded bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 text-[10px] font-bold"
                          >
                            ⚠️ Vắng ≥ 3
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Nút 1-Chạm đổi trạng thái (To, dễ bấm) */}
                  <button
                    onClick={() => cycleStatus(r.student_id)}
                    title="Bấm để đổi: Có mặt -> Có phép -> Không phép -> Đi muộn"
                    className={`px-3 py-1.5 rounded-xl font-bold text-xs shadow-sm transition transform active:scale-95 shrink-0 ${config.color}`}
                  >
                    {config.label}
                  </button>
                </div>

                {/* Phần dưới: Nhập lý do (nếu P hoặc K) hoặc Số phút muộn (nếu M) */}
                {r.status !== 'C' && (
                  <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 space-y-2">
                    {r.status === 'M' ? (
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-semibold text-slate-500">Đi muộn:</span>
                        <div className="flex items-center gap-1">
                          {[5, 10, 15, 30].map((mins) => (
                            <button
                              key={mins}
                              onClick={() => updateDetail(r.student_id, 'minutes_late', mins)}
                              className={`px-2 py-0.5 rounded text-[11px] font-bold transition ${
                                r.minutes_late === mins
                                  ? 'bg-orange-500 text-white'
                                  : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                              }`}
                            >
                              +{mins}p
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <input
                          type="text"
                          placeholder="Nhập lý do vắng..."
                          value={r.reason || ''}
                          onChange={(e) => updateDetail(r.student_id, 'reason', e.target.value)}
                          className="w-full text-xs px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 placeholder-slate-400 outline-none focus:border-emerald-500"
                        />
                        {/* Gợi ý lý do nhanh */}
                        <div className="flex flex-wrap gap-1">
                          {COMMON_REASONS.slice(0, 3).map((hint) => (
                            <button
                              key={hint}
                              onClick={() => updateDetail(r.student_id, 'reason', hint)}
                              className="text-[10px] px-1.5 py-0.5 rounded bg-white/70 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-white border border-slate-200/50 dark:border-slate-700/50"
                            >
                              {hint}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Floating Save Button on Mobile */}
      <div className="lg:hidden fixed bottom-16 left-4 right-4 z-20">
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full py-3 px-4 rounded-xl font-bold text-sm bg-emerald-600 text-white shadow-xl shadow-emerald-700/30 flex items-center justify-center gap-2 transition active:scale-95 disabled:opacity-50"
        >
          <Save className="w-5 h-5" />
          <span>{saving ? 'Đang lưu điểm danh...' : `Lưu Điểm Danh Hôm Nay (${presentCount}/${total})`}</span>
        </button>
      </div>
    </div>
  );
}

