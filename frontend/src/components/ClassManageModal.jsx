import React, { useState } from 'react';
import { X, School, Plus, Edit2, Check, Sparkles } from 'lucide-react';
import { api } from '../api';

export default function ClassManageModal({
  classes,
  currentClassId,
  onSelectClass,
  onClassesUpdated,
  onClose,
}) {
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [newClassName, setNewClassName] = useState('');
  const [newGrade, setNewGrade] = useState(10);
  const [newSchoolYear, setNewSchoolYear] = useState('2025-2026');

  // Bắt đầu sửa tên lớp
  const startEdit = (cls) => {
    setEditingId(cls.id);
    setEditName(cls.name);
  };

  // Lưu sửa tên lớp
  const handleSaveEdit = async (id) => {
    if (!editName.trim()) return;
    try {
      await api.classes.update(id, { name: editName.trim() });
      setEditingId(null);
      onClassesUpdated(await api.classes.list());
    } catch (err) {
      alert(`Không đổi được tên lớp: ${err.message}`);
    }
  };

  // Thêm lớp mới
  const handleAddClass = async (e) => {
    e.preventDefault();
    if (!newClassName.trim()) return;

    try {
      const created = await api.classes.create({
        name: newClassName.trim(),
        grade: newGrade,
        school_year: newSchoolYear.trim(),
      });
      setNewClassName('');
      onClassesUpdated(await api.classes.list());
      await onSelectClass(created.id);
    } catch (err) {
      alert(`Không tạo được lớp: ${err.message}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-8 flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center">
              <School className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Chọn & Quản Lý Lớp Chủ Nhiệm</h2>
              <p className="text-xs text-emerald-100">
                Chuyển đổi lớp hoặc thêm lớp mới để quản lý
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/20 hover:bg-white/30 text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Nội dung */}
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto text-xs">
          {/* Danh sách lớp hiện có */}
          <div className="space-y-2.5">
            <span className="font-bold uppercase tracking-wider text-slate-500">
              Danh sách lớp học trong hệ thống
            </span>

            <div className="space-y-2">
              {classes.map((cls) => {
                const isSelected = cls.id === currentClassId;

                return (
                  <div
                    key={cls.id}
                    className={`p-3.5 rounded-2xl border transition flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-400 dark:border-emerald-700 shadow-sm'
                        : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                          isSelected
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {cls.grade || 10}
                      </div>

                      {editingId === cls.id ? (
                        <div className="flex items-center gap-2 flex-1">
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="px-2.5 py-1.5 rounded-lg border border-emerald-400 bg-white dark:bg-slate-900 font-bold text-slate-800 dark:text-white outline-none w-32"
                            autoFocus
                          />
                          <button
                            onClick={() => handleSaveEdit(cls.id)}
                            className="p-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700"
                            title="Lưu tên lớp"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="p-1.5 rounded-lg bg-slate-200 text-slate-600 hover:bg-slate-300"
                            title="Hủy"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-sm text-slate-900 dark:text-white truncate">
                              Lớp {cls.name}
                            </h3>
                            {isSelected && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300">
                                Đang chọn
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500">
                            Khối {cls.grade || 10} • Năm học {cls.school_year || '2025-2026'}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {editingId !== cls.id && (
                        <button
                          onClick={() => startEdit(cls)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                          title="Sửa tên lớp"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {!isSelected && (
                        <button
                          onClick={() => {
                            onSelectClass(cls.id);
                            onClose();
                          }}
                          className="px-3 py-1.5 rounded-xl font-bold text-xs bg-slate-200 hover:bg-emerald-600 hover:text-white dark:bg-slate-700 dark:hover:bg-emerald-600 text-slate-700 dark:text-slate-200 transition"
                        >
                          Chọn lớp này
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Form thêm lớp mới */}
          <form onSubmit={handleAddClass} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-3">
            <span className="font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5 text-emerald-600" />
              Thêm lớp học mới
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div>
                <label className="text-[11px] font-semibold text-slate-500">Tên lớp</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: 10A3, 11 Tin..."
                  value={newClassName}
                  onChange={(e) => setNewClassName(e.target.value)}
                  className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 outline-none focus:border-emerald-500 font-bold"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-500">Khối</label>
                <select
                  value={newGrade}
                  onChange={(e) => setNewGrade(Number(e.target.value))}
                  className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 outline-none"
                >
                  <option value={10}>Khối 10</option>
                  <option value={11}>Khối 11</option>
                  <option value={12}>Khối 12</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-500">Năm học</label>
                <input
                  type="text"
                  value={newSchoolYear}
                  onChange={(e) => setNewSchoolYear(e.target.value)}
                  className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition active:scale-95"
            >
              + Tạo Lớp Mới
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 font-semibold text-slate-600 hover:text-slate-800 dark:text-slate-400 rounded-xl"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}

