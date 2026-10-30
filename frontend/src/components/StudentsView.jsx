import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import {
  Users,
  Search,
  Filter,
  UserPlus,
  FileSpreadsheet,
  LayoutGrid,
  List,
  PhoneCall,
  ShieldAlert,
  ArrowRight,
  MoreVertical,
  Calendar,
  Sparkles,
  Upload,
} from 'lucide-react';
import { api } from '../api';
import StudentDetailModal from './StudentDetailModal';
import StudentFormModal from './StudentFormModal';
import ImportStudentsModal from './ImportStudentsModal';

export default function StudentsView({ user, currentClass, selectedStudentId, onClearSelectedStudent }) {
  const isGVCN = user?.role === 'gvcn';

  const [students, setStudents] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterGroup, setFilterGroup] = useState('all');
  const [filterFlagged, setFilterFlagged] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'

  const [detailStudent, setDetailStudent] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);

  useEffect(() => {
    loadStudents();
    loadGroups();
  }, [currentClass?.id]);

  // Nếu có selectedStudentId truyền từ Dashboard vào thì mở detail modal
  useEffect(() => {
    if (selectedStudentId && students.length > 0) {
      const found = students.find((s) => s.id === selectedStudentId);
      if (found) setDetailStudent(found);
    }
  }, [selectedStudentId, students]);

  const loadGroups = async () => {
    try {
      const res = await api.students.groups();
      setGroups(res);
    } catch (err) {
      console.error('Lỗi tải tổ:', err);
    }
  };

  const loadStudents = async () => {
    try {
      setLoading(true);
      const res = await api.students.list();
      setStudents(res);
    } catch (err) {
      console.error('Lỗi tải danh sách học sinh:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStudentUpdated = (updated) => {
    setStudents((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
    setDetailStudent(updated);
  };

  const handleStudentDeleted = (deletedId) => {
    setStudents((prev) => prev.filter((s) => s.id !== deletedId));
    setDetailStudent(null);
  };

  const handleStudentCreated = (created) => {
    setStudents((prev) => [...prev, created]);
  };

  const handleExportExcel = () => {
    try {
      const data = filteredStudents.map((s, idx) => ({
        STT: idx + 1,
        'Họ và tên': s.full_name,
        'Ngày sinh': s.dob || '',
        'Giới tính': s.gender,
        'Tổ': s.group_name || '',
        'Chức vụ': s.role_in_class || 'Thành viên',
        'Phụ huynh': s.parent_name || '',
        'SĐT Phụ huynh': s.parent_phone || '',
        'Địa chỉ': s.address || '',
        'Ghi chú': s.is_flagged_risk ? `Cần quan tâm: ${s.risk_reason}` : '',
      }));
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Danh sách học sinh');
      XLSX.writeFile(wb, `Danh_sach_lop_10A1_${new Date().toISOString().split('T')[0]}.xlsx`);
    } catch (err) {
      window.open(api.students.exportExcelUrl(), '_blank');
    }
  };

  // Lọc dữ liệu hiển thị
  const filteredStudents = students.filter((s) => {
    const matchSearch =
      s.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.parent_phone && s.parent_phone.includes(searchTerm));
    const matchGroup = filterGroup === 'all' || s.group_name === filterGroup;
    const matchFlagged = !filterFlagged || s.is_flagged_risk;
    return matchSearch && matchGroup && matchFlagged;
  });

  return (
    <div className="space-y-6 pb-20 lg:pb-8">
      {/* Header thanh tác vụ */}
      <div className="bg-white dark:bg-slate-800/90 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Users className="w-6 h-6 text-emerald-500" />
              Hồ Sơ Học Sinh Lớp ({students.length} học sinh)
            </h1>
            <p className="text-xs text-slate-500">
              Quản lý hồ sơ toàn diện theo chuẩn Thông tư 15/2026/TT-BGDĐT. Bảo mật dữ liệu cá nhân học sinh.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {isGVCN && (
              <>
                <button
                  onClick={() => setShowImportModal(true)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 transition active:scale-95 shadow-sm"
                  title="Nạp dữ liệu học sinh từ Excel hoặc dữ liệu mẫu"
                >
                  <Upload className="w-4 h-4 text-emerald-600" />
                  <span>Nạp Dữ Liệu Học Sinh</span>
                </button>

                <button
                  onClick={handleExportExcel}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 transition"
                  title="Xuất file Excel danh sách lớp"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  <span>Xuất Excel</span>
                </button>

                <button
                  onClick={() => setShowAddModal(true)}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 transition active:scale-95"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Thêm Học Sinh</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Thanh tìm kiếm và bộ lọc */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-100 dark:border-slate-700/80">
          {/* Ô tìm kiếm */}
          <div className="sm:col-span-2 flex items-center gap-2 bg-slate-50 dark:bg-slate-900/60 px-3 py-2 rounded-xl border border-slate-200/70 dark:border-slate-700">
            <Search className="w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm kiếm theo họ tên hoặc SĐT..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-transparent text-xs font-medium text-slate-800 dark:text-slate-200 outline-none w-full placeholder-slate-400"
            />
          </div>

          {/* Lọc Tổ */}
          <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-900/60 px-3 py-2 rounded-xl border border-slate-200/70 dark:border-slate-700">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={filterGroup}
              onChange={(e) => setFilterGroup(e.target.value)}
              className="bg-transparent text-xs font-semibold text-slate-800 dark:text-slate-200 outline-none w-full cursor-pointer"
            >
              <option value="all" className="dark:bg-slate-900">Tất cả các Tổ</option>
              {groups.map((g) => (
                <option key={g.id} value={g.name} className="dark:bg-slate-900">
                  {g.name}
                </option>
              ))}
            </select>
          </div>

          {/* Nút lọc Cần Quan Tâm & Chuyển dạng xem */}
          <div className="flex items-center justify-between gap-2">
            <button
              onClick={() => setFilterFlagged(!filterFlagged)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition border ${
                filterFlagged
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                  : 'bg-slate-50 dark:bg-slate-900/60 text-slate-700 dark:text-slate-300 border-slate-200/70 dark:border-slate-700 hover:bg-slate-100'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Cần quan tâm</span>
            </button>

            <div className="flex items-center bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200/70 dark:border-slate-700">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition ${
                  viewMode === 'grid'
                    ? 'bg-white dark:bg-slate-800 text-emerald-600 shadow-sm'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
                title="Xem dạng thẻ"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg transition ${
                  viewMode === 'table'
                    ? 'bg-white dark:bg-slate-800 text-emerald-600 shadow-sm'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
                title="Xem dạng bảng"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Hiển thị danh sách học sinh */}
      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[350px] space-y-3">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs text-slate-500 font-medium">Đang tải hồ sơ học sinh...</p>
        </div>
      ) : filteredStudents.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
          <Users className="w-10 h-10 text-slate-400 mx-auto" />
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            Không tìm thấy học sinh nào phù hợp
          </p>
          <p className="text-xs text-slate-400">Thử thay đổi từ khóa tìm kiếm hoặc bỏ bộ lọc</p>
        </div>
      ) : viewMode === 'grid' ? (
        /* DẠNG LƯỚI THẺ (CARDS) */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredStudents.map((s, idx) => (
            <div
              key={s.id}
              onClick={() => setDetailStudent(s)}
              className="bg-white dark:bg-slate-800/80 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-emerald-300 dark:hover:border-emerald-700 transition cursor-pointer flex flex-col justify-between space-y-3 group"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white font-bold flex items-center justify-center text-sm shadow-sm">
                      {s.full_name?.split(' ').pop()?.[0]}
                    </div>
                    <div>
                      <h2 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition truncate max-w-[150px]">
                        {s.full_name}
                      </h2>
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                        <span>{s.gender}</span>
                        <span>•</span>
                        <span>{s.group_name || 'Lớp 10A1'}</span>
                      </div>
                    </div>
                  </div>

                  {s.is_flagged_risk && (
                    <span
                      title={`Học sinh cần quan tâm: ${s.risk_reason}`}
                      className="p-1 rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-300"
                    >
                      <ShieldAlert className="w-4 h-4" />
                    </span>
                  )}
                </div>

                <div className="mt-3 space-y-1 text-xs">
                  {s.role_in_class && s.role_in_class !== 'Thành viên' && (
                    <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                      🎖️ {s.role_in_class}
                    </span>
                  )}

                  {s.parent_name && (
                    <p className="text-[11px] text-slate-500 truncate">
                      PH: <span className="text-slate-700 dark:text-slate-300 font-medium">{s.parent_name}</span>
                    </p>
                  )}

                  {s.is_flagged_risk && s.risk_reason && (
                    <p className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium truncate">
                      ⚠️ {s.risk_reason}
                    </p>
                  )}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-xs text-slate-400 group-hover:text-emerald-600 transition">
                <span className="text-[11px]">Xem hồ sơ chi tiết</span>
                <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* DẠNG BẢNG (TABLE) */
        <div className="bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="py-3 px-4">STT</th>
                  <th className="py-3 px-4">Họ và tên</th>
                  <th className="py-3 px-4">Ngày sinh</th>
                  <th className="py-3 px-4">Giới tính</th>
                  <th className="py-3 px-4">Tổ</th>
                  <th className="py-3 px-4">Chức vụ</th>
                  <th className="py-3 px-4">Phụ huynh</th>
                  <th className="py-3 px-4">SĐT</th>
                  <th className="py-3 px-4 text-center">Tác vụ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                {filteredStudents.map((s, idx) => (
                  <tr
                    key={s.id}
                    onClick={() => setDetailStudent(s)}
                    className="hover:bg-slate-50 dark:hover:bg-slate-900/40 transition cursor-pointer"
                  >
                    <td className="py-3 px-4 font-bold text-slate-400">{idx + 1}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 dark:text-white">
                          {s.full_name}
                        </span>
                        {s.is_flagged_risk && (
                          <span title={s.risk_reason} className="text-indigo-600">
                            🚩
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">{s.dob || '—'}</td>
                    <td className="py-3 px-4">{s.gender}</td>
                    <td className="py-3 px-4 font-medium">{s.group_name || '—'}</td>
                    <td className="py-3 px-4">
                      {s.role_in_class !== 'Thành viên' ? (
                        <span className="px-2 py-0.5 rounded-full font-bold text-[10px] bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                          {s.role_in_class}
                        </span>
                      ) : (
                        <span className="text-slate-400">Thành viên</span>
                      )}
                    </td>
                    <td className="py-3 px-4">{s.parent_name || '—'}</td>
                    <td className="py-3 px-4">{s.parent_phone || '—'}</td>
                    <td className="py-3 px-4 text-center">
                      <button className="text-emerald-600 hover:text-emerald-700 font-bold text-xs">
                        Chi tiết
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Chi Tiết Học Sinh */}
      {detailStudent && (
        <StudentDetailModal
          student={detailStudent}
          onClose={() => {
            setDetailStudent(null);
            if (onClearSelectedStudent) onClearSelectedStudent();
          }}
          onUpdated={handleStudentUpdated}
          onDeleted={handleStudentDeleted}
          user={user}
        />
      )}

      {/* Modal Thêm Mới Học Sinh */}
      {showAddModal && (
        <StudentFormModal
          groups={groups}
          onClose={() => setShowAddModal(false)}
          onCreated={handleStudentCreated}
        />
      )}

      {/* Modal Nạp Dữ Liệu Học Sinh (Excel hoặc Mẫu 40 HS) */}
      {showImportModal && (
        <ImportStudentsModal
          currentClassName={currentClass?.name || '10A1'}
          onClose={() => setShowImportModal(false)}
          onImportSuccess={(updatedList) => {
            setStudents(updatedList);
            loadGroups();
          }}
        />
      )}
    </div>
  );
}

