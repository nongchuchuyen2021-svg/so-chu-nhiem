import React, { useState } from 'react';
import {
  X,
  User,
  Phone,
  Home,
  Briefcase,
  Heart,
  FileText,
  ShieldAlert,
  Edit2,
  Save,
  Trash2,
  Calendar,
} from 'lucide-react';
import { api } from '../api';

export default function StudentDetailModal({ student, onClose, onUpdated, onDeleted, user }) {
  const isGVCN = user?.role === 'gvcn';
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({ ...student });
  const [saving, setSaving] = useState(false);

  if (!student) return null;

  const handleChange = (field, val) => {
    setFormData((prev) => ({ ...prev, [field]: val }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const res = await api.students.update(student.id, formData);
      onUpdated(res);
      setEditing(false);
    } catch (err) {
      alert(`Lỗi lưu hồ sơ: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (confirm(`Bạn có chắc chắn muốn xóa học sinh "${student.full_name}" khỏi danh sách lớp?`)) {
      try {
        await api.students.delete(student.id);
        onDeleted(student.id);
      } catch (err) {
        alert(`Lỗi xóa: ${err.message}`);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-8">
        {/* Header Modal */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center text-lg font-bold">
              {formData.full_name?.split(' ').pop()?.[0] || 'HS'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold">{formData.full_name}</h2>
                <span className="px-2 py-0.5 rounded-full bg-white/20 text-xs font-semibold">
                  {formData.gender}
                </span>
              </div>
              <p className="text-xs text-emerald-100">
                {formData.role_in_class || 'Thành viên'} • {formData.group_name || 'Chưa có tổ'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isGVCN && !editing && (
              <button
                onClick={() => setEditing(true)}
                className="p-2 rounded-xl bg-white/20 hover:bg-white/30 text-white transition"
                title="Chỉnh sửa hồ sơ"
              >
                <Edit2 className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/20 hover:bg-white/30 text-white transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Nội dung thông tin */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto text-sm">
          {/* Cảnh báo Cần quan tâm */}
          <div className="p-3.5 rounded-xl border flex items-start justify-between gap-3 bg-indigo-50/50 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-900">
            <div className="flex items-start gap-2.5">
              <ShieldAlert className="w-5 h-5 text-indigo-600 mt-0.5" />
              <div>
                <p className="font-bold text-xs text-indigo-900 dark:text-indigo-200">
                  Theo dõi & Hỗ trợ học sinh (Thông tư 15)
                </p>
                {editing ? (
                  <div className="mt-2 space-y-2">
                    <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.is_flagged_risk}
                        onChange={(e) => handleChange('is_flagged_risk', e.target.checked)}
                        className="rounded text-emerald-600"
                      />
                      Gắn cờ học sinh cần quan tâm đặc biệt
                    </label>
                    {formData.is_flagged_risk && (
                      <input
                        type="text"
                        placeholder="Lý do cần quan tâm (vắng nhiều, gia cảnh khó khăn, tự ti...)"
                        value={formData.risk_reason || ''}
                        onChange={(e) => handleChange('risk_reason', e.target.value)}
                        className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-indigo-200 dark:border-indigo-800 bg-white dark:bg-slate-800"
                      />
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-indigo-700 dark:text-indigo-300 mt-0.5">
                    {formData.is_flagged_risk
                      ? `⚠️ Cờ báo động: ${formData.risk_reason || 'Cần theo dõi sát nề nếp và hoàn cảnh'}`
                      : 'Học sinh đang duy trì nề nếp học tập bình thường.'}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Thông tin cá nhân & Chức vụ */}
          <div className="space-y-3">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400">
              Thông tin học sinh
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-slate-500 font-medium">Họ và tên</label>
                {editing ? (
                  <input
                    type="text"
                    value={formData.full_name}
                    onChange={(e) => handleChange('full_name', e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                ) : (
                  <p className="font-semibold text-slate-800 dark:text-slate-200">{formData.full_name}</p>
                )}
              </div>

              <div>
                <label className="text-xs text-slate-500 font-medium">Ngày sinh</label>
                {editing ? (
                  <input
                    type="date"
                    value={formData.dob || ''}
                    onChange={(e) => handleChange('dob', e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                ) : (
                  <p className="font-semibold text-slate-800 dark:text-slate-200">
                    {formData.dob || 'Chưa cập nhật'}
                  </p>
                )}
              </div>

              <div>
                <label className="text-xs text-slate-500 font-medium">Chức vụ trong lớp</label>
                {editing ? (
                  <select
                    value={formData.role_in_class || 'Thành viên'}
                    onChange={(e) => handleChange('role_in_class', e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  >
                    <option value="Lớp trưởng">Lớp trưởng</option>
                    <option value="Lớp phó học tập">Lớp phó học tập</option>
                    <option value="Lớp phó đời sống">Lớp phó đời sống</option>
                    <option value="Bí thư Chi đoàn">Bí thư Chi đoàn</option>
                    <option value="Tổ trưởng Tổ 1">Tổ trưởng Tổ 1</option>
                    <option value="Tổ trưởng Tổ 2">Tổ trưởng Tổ 2</option>
                    <option value="Tổ trưởng Tổ 3">Tổ trưởng Tổ 3</option>
                    <option value="Tổ trưởng Tổ 4">Tổ trưởng Tổ 4</option>
                    <option value="Cán sự Thể dục">Cán sự Thể dục</option>
                    <option value="Thủ quỹ lớp">Thủ quỹ lớp</option>
                    <option value="Thành viên">Thành viên</option>
                  </select>
                ) : (
                  <p className="font-semibold text-slate-800 dark:text-slate-200">
                    {formData.role_in_class || 'Thành viên'}
                  </p>
                )}
              </div>

              <div>
                <label className="text-xs text-slate-500 font-medium">Địa chỉ cư trú</label>
                {editing ? (
                  <input
                    type="text"
                    value={formData.address || ''}
                    onChange={(e) => handleChange('address', e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                ) : (
                  <p className="font-semibold text-slate-800 dark:text-slate-200">
                    {formData.address || 'Chưa cập nhật'}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Thông tin phụ huynh */}
          <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400">
              Thông tin cha mẹ / Người giám hộ
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-slate-500 font-medium">Họ tên cha/mẹ</label>
                {editing ? (
                  <input
                    type="text"
                    value={formData.parent_name || ''}
                    onChange={(e) => handleChange('parent_name', e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                ) : (
                  <p className="font-semibold text-slate-800 dark:text-slate-200">
                    {formData.parent_name || 'Chưa cập nhật'}
                  </p>
                )}
              </div>

              <div>
                <label className="text-xs text-slate-500 font-medium">Số điện thoại phụ huynh</label>
                {editing ? (
                  <input
                    type="text"
                    value={formData.parent_phone || ''}
                    onChange={(e) => handleChange('parent_phone', e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                ) : (
                  <div className="flex items-center gap-2 mt-0.5">
                    <p className="font-semibold text-slate-800 dark:text-slate-200">
                      {formData.parent_phone || 'Chưa cập nhật'}
                    </p>
                    {formData.parent_phone && formData.parent_phone !== '***' && (
                      <a
                        href={`tel:${formData.parent_phone}`}
                        className="px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 text-xs font-bold hover:bg-emerald-100 transition"
                      >
                        Gọi điện
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Hoàn cảnh gia đình & Sở thích */}
          <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400">
              Hoàn cảnh & Đặc điểm học sinh
            </h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-500 font-medium">Hoàn cảnh gia đình</label>
                {editing ? (
                  <textarea
                    rows={2}
                    value={formData.family_background || ''}
                    onChange={(e) => handleChange('family_background', e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                ) : (
                  <p className="text-slate-700 dark:text-slate-300 text-xs mt-0.5">
                    {formData.family_background || 'Bình thường, không có ghi chú đặc biệt.'}
                  </p>
                )}
              </div>

              {/* Ghi chú riêng bí mật của GVCN */}
              {isGVCN && (
                <div className="p-3.5 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900 dark:text-amber-200 mb-1">
                    <FileText className="w-4 h-4 text-amber-600" />
                    <span>Ghi chú riêng của GVCN (Bảo mật tuyệt đối)</span>
                  </div>
                  {editing ? (
                    <textarea
                      rows={2}
                      placeholder="Ghi chú tính cách, phương pháp giáo dục riêng (cán bộ lớp & phụ huynh không xem được)..."
                      value={formData.private_notes || ''}
                      onChange={(e) => handleChange('private_notes', e.target.value)}
                      className="w-full text-xs px-3 py-2 rounded-xl border border-amber-300 dark:border-amber-800 bg-white dark:bg-slate-800"
                    />
                  ) : (
                    <p className="text-xs text-amber-900/90 dark:text-amber-200/90 italic">
                      {formData.private_notes || 'Chưa có ghi chú riêng cho học sinh này.'}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer Modal */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            {isGVCN && editing && (
              <button
                onClick={handleDelete}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Xóa học sinh
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {editing ? (
              <>
                <button
                  onClick={() => setEditing(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 dark:text-slate-400 rounded-xl"
                >
                  Hủy
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-md transition disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  {saving ? 'Đang lưu...' : 'Lưu Thay Đổi'}
                </button>
              </>
            ) : (
              <button
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 rounded-xl transition"
              >
                Đóng
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

