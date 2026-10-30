import React, { useState } from 'react';
import { X, UserPlus, Save } from 'lucide-react';
import { api } from '../api';

export default function StudentFormModal({ onClose, onCreated, groups }) {
  const [formData, setFormData] = useState({
    full_name: '',
    dob: '2010-01-01',
    gender: 'Nam',
    group_id: groups?.[0]?.id || 1,
    role_in_class: 'Thành viên',
    parent_name: '',
    parent_phone: '',
    parent_job: '',
    address: '',
    family_background: '',
    interests: '',
    private_notes: '',
    is_flagged_risk: false,
    risk_reason: '',
  });

  const [saving, setSaving] = useState(false);

  const handleChange = (field, val) => {
    setFormData((prev) => ({ ...prev, [field]: val }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.full_name.trim()) {
      alert('Vui lòng nhập họ và tên học sinh');
      return;
    }

    try {
      setSaving(true);
      const res = await api.students.create(formData);
      onCreated(res);
      onClose();
    } catch (err) {
      alert(`Lỗi thêm học sinh: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-8">
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <UserPlus className="w-5 h-5" />
            <h2 className="text-lg font-bold">Thêm Học Sinh Mới Vào Lớp</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className="font-semibold text-slate-700 dark:text-slate-300">
                Họ và tên học sinh <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Ví dụ: Nguyễn Văn An"
                value={formData.full_name}
                onChange={(e) => handleChange('full_name', e.target.value)}
                className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300">Giới tính</label>
              <select
                value={formData.gender}
                onChange={(e) => handleChange('gender', e.target.value)}
                className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 outline-none"
              >
                <option value="Nam">Nam</option>
                <option value="Nữ">Nữ</option>
              </select>
            </div>

            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300">Ngày sinh</label>
              <input
                type="date"
                value={formData.dob}
                onChange={(e) => handleChange('dob', e.target.value)}
                className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 outline-none"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300">Phân vào Tổ</label>
              <select
                value={formData.group_id}
                onChange={(e) => handleChange('group_id', Number(e.target.value))}
                className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 outline-none"
              >
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300">Chức vụ trong lớp</label>
              <select
                value={formData.role_in_class}
                onChange={(e) => handleChange('role_in_class', e.target.value)}
                className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 outline-none"
              >
                <option value="Thành viên">Thành viên</option>
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
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300">Họ tên Phụ huynh</label>
              <input
                type="text"
                placeholder="Bác / Cô..."
                value={formData.parent_name}
                onChange={(e) => handleChange('parent_name', e.target.value)}
                className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 outline-none"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300">SĐT Phụ huynh</label>
              <input
                type="text"
                placeholder="0987..."
                value={formData.parent_phone}
                onChange={(e) => handleChange('parent_phone', e.target.value)}
                className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="font-semibold text-slate-700 dark:text-slate-300">Địa chỉ cư trú</label>
              <input
                type="text"
                placeholder="Số nhà, phố, quận/huyện..."
                value={formData.address}
                onChange={(e) => handleChange('address', e.target.value)}
                className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 outline-none"
              />
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <label className="font-semibold text-slate-700 dark:text-slate-300">
              Ghi chú riêng của GVCN (Bảo mật)
            </label>
            <textarea
              rows={2}
              placeholder="Đặc điểm tính cách, lưu ý sức khỏe..."
              value={formData.private_notes}
              onChange={(e) => handleChange('private_notes', e.target.value)}
              className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 font-semibold text-slate-600 hover:text-slate-800 dark:text-slate-400 rounded-xl"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-1.5 px-4 py-2 font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-md transition disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Đang thêm...' : 'Thêm Vào Lớp'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

