import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import {
  X,
  Upload,
  FileSpreadsheet,
  Download,
  Sparkles,
  Check,
  AlertCircle,
  Trash2,
  RefreshCw,
  Users,
} from 'lucide-react';
import { api } from '../api';

export default function ImportStudentsModal({ onClose, onImportSuccess, currentClassName }) {
  const fileInputRef = useRef(null);
  const [previewList, setPreviewList] = useState([]);
  const [replaceMode, setReplaceMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fileName, setFileName] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Tải file Excel mẫu
  const downloadTemplate = () => {
    const templateData = [
      {
        'STT': 1,
        'Họ và tên': 'Nguyễn Văn An',
        'Ngày sinh': '2010-05-15',
        'Giới tính': 'Nam',
        'Tổ': 'Tổ 1',
        'Chức vụ': 'Lớp trưởng',
        'Phụ huynh': 'Bác An (Bố)',
        'SĐT Phụ huynh': '0987111222',
        'Nghề nghiệp': 'Công chức',
        'Địa chỉ': 'Số 12 Phố Trần Phú, Hà Nội',
        'Hoàn cảnh': 'Gia đình cơ bản',
        'Ghi chú': 'Nhanh nhẹn, chăm chỉ',
      },
      {
        'STT': 2,
        'Họ và tên': 'Trần Thị Bình',
        'Ngày sinh': '2010-08-20',
        'Giới tính': 'Nữ',
        'Tổ': 'Tổ 2',
        'Chức vụ': 'Lớp phó học tập',
        'Phụ huynh': 'Bác Bình (Mẹ)',
        'SĐT Phụ huynh': '0987333444',
        'Nghề nghiệp': 'Kinh doanh',
        'Địa chỉ': 'Số 34 Phố Trần Phú, Hà Nội',
        'Hoàn cảnh': 'Bình thường',
        'Ghi chú': 'Học tốt môn Toán',
      },
      {
        'STT': 3,
        'Họ và tên': 'Lê Quốc Cường',
        'Ngày sinh': '2010-11-02',
        'Giới tính': 'Nam',
        'Tổ': 'Tổ 3',
        'Chức vụ': 'Thành viên',
        'Phụ huynh': 'Bác Cường (Bố)',
        'SĐT Phụ huynh': '0987555666',
        'Nghề nghiệp': 'Tự do',
        'Địa chỉ': 'Số 56 Phố Trần Phú, Hà Nội',
        'Hoàn cảnh': 'Nhà xa trường',
        'Ghi chú': 'Cần nhắc nhở đi học đúng giờ',
      },
    ];

    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Mau_Hoc_Sinh');
    XLSX.writeFile(wb, `Mau_Danh_Sach_Hoc_Sinh_${currentClassName || 'THPT'}.xlsx`);
  };

  // Nạp 40 học sinh mẫu chuẩn THPT
  const handleSeedDemo = async () => {
    if (!confirm(`Thay TOÀN BỘ danh sách lớp ${currentClassName} bằng 40 học sinh mẫu? Dữ liệu và điểm danh hiện có của lớp sẽ bị xóa.`)) return;
    try {
      setLoading(true);
      const res = await api.students.seedDemo();
      onImportSuccess(res);
      onClose();
    } catch (err) {
      alert(`Lỗi nạp dữ liệu mẫu: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Đọc file Excel từ máy tính
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMsg('');
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const rawJson = XLSX.utils.sheet_to_json(ws);

        if (!rawJson || rawJson.length === 0) {
          setErrorMsg('File Excel không có dữ liệu học sinh hoặc bảng trống.');
          return;
        }

        // Chuẩn hóa dữ liệu đọc được
        const normalized = rawJson.map((row) => {
          // Tìm trường họ tên
          const name =
            row['Họ và tên'] ||
            row['Họ tên'] ||
            row['Họ và Tên'] ||
            row['Tên'] ||
            row['full_name'] ||
            row['FullName'] ||
            '';

          return {
            full_name: String(name).trim(),
            gender: row['Giới tính'] || row['gender'] || 'Nam',
            dob: row['Ngày sinh'] || row['dob'] || '',
            group_name: row['Tổ'] || row['group_name'] || 'Tổ 1',
            role_in_class: row['Chức vụ'] || row['role'] || 'Thành viên',
            parent_name: row['Phụ huynh'] || row['Họ tên PH'] || row['parent_name'] || '',
            parent_phone: String(row['SĐT Phụ huynh'] || row['SĐT'] || row['parent_phone'] || '').replace(/[^0-9]/g, ''),
            parent_job: row['Nghề nghiệp'] || row['parent_job'] || '',
            address: row['Địa chỉ'] || row['address'] || '',
            family_background: row['Hoàn cảnh'] || row['family_background'] || '',
            private_notes: row['Ghi chú'] || row['note'] || '',
          };
        }).filter((s) => s.full_name);

        if (normalized.length === 0) {
          setErrorMsg('Không tìm thấy cột "Họ và tên" hợp lệ trong file Excel.');
          return;
        }

        setPreviewList(normalized);
      } catch (err) {
        console.error('Lỗi đọc Excel:', err);
        setErrorMsg('Không thể đọc file Excel này. Vui lòng kiểm tra lại định dạng tệp.');
      }
    };

    reader.readAsBinaryString(file);
  };

  // Xác nhận nạp danh sách vào lớp
  const handleConfirmImport = async () => {
    if (previewList.length === 0) return;
    if (replaceMode && !confirm(`Xóa toàn bộ danh sách và điểm danh hiện có của lớp ${currentClassName} rồi nạp ${previewList.length} học sinh mới?`)) return;

    try {
      setLoading(true);
      const res = await api.students.importList(previewList, { replace: replaceMode });
      onImportSuccess(res);
      onClose();
    } catch (err) {
      alert(`Lỗi nạp dữ liệu: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 w-full max-w-3xl rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-8 flex flex-col">
        {/* Header Modal */}
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-sky-700 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center">
              <Upload className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Nạp Dữ Liệu Học Sinh Vào Lớp</h2>
              <p className="text-xs text-emerald-100">
                Lớp đang chọn: <strong>{currentClassName}</strong>
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

        {/* Thân Modal */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto text-xs">
          {/* Lựa chọn 1: Nạp nhanh 40 học sinh mẫu THPT */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 border border-emerald-200 dark:border-emerald-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-sm text-emerald-900 dark:text-emerald-200">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span>Nạp nhanh dữ liệu mẫu 40 học sinh (Khuyến nghị dùng thử)</span>
              </div>
              <p className="text-emerald-700/80 dark:text-emerald-300/80 text-[11px]">
                Nạp sẵn 40 em học sinh với đầy đủ chức vụ (Lớp trưởng, Bí thư, Tổ trưởng), hoàn cảnh, sở thích, SĐT phụ huynh và chia đều vào 4 Tổ.
              </p>
            </div>

            <button
              onClick={handleSeedDemo}
              disabled={loading}
              className="px-4 py-2.5 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 transition active:scale-95 shrink-0 flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Nạp 40 HS Mẫu</span>
            </button>
          </div>

          {/* Lựa chọn 2: Nhập từ file Excel */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs uppercase tracking-wider text-slate-500">
                Hoặc tải lên danh sách từ file Excel (.xlsx, .xls)
              </span>
              <button
                type="button"
                onClick={downloadTemplate}
                className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold hover:underline"
              >
                <Download className="w-3.5 h-3.5" />
                Tải file Excel mẫu
              </button>
            </div>

            {/* Khung Kéo Thả File */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-emerald-500 rounded-2xl p-6 text-center cursor-pointer transition bg-slate-50/50 dark:bg-slate-800/40 space-y-2 group"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={handleFileUpload}
                className="hidden"
              />
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto group-hover:scale-110 transition">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <p className="font-bold text-slate-800 dark:text-slate-200">
                {fileName ? `Đã chọn: ${fileName}` : 'Bấm vào đây để chọn file Excel từ máy tính'}
              </p>
              <p className="text-[11px] text-slate-400">
                Hỗ trợ các định dạng .xlsx, .xls (Tự động nhận diện cột Họ tên, Ngày sinh, Giới tính, Tổ, SĐT)
              </p>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}
          </div>

          {/* Bảng Xem Trước (Preview) Danh Sách Học Sinh */}
          {previewList.length > 0 && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 dark:text-white">
                    Xem trước ({previewList.length} học sinh sẵn sàng nạp):
                  </span>
                </div>

                <label className="flex items-center gap-2 font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={replaceMode}
                    onChange={(e) => setReplaceMode(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Xóa danh sách cũ trước khi nạp</span>
                </label>
              </div>

              <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden max-h-56 overflow-y-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-100 dark:bg-slate-800 sticky top-0 text-slate-600 dark:text-slate-300 font-semibold">
                    <tr>
                      <th className="py-2 px-3">STT</th>
                      <th className="py-2 px-3">Họ và tên</th>
                      <th className="py-2 px-3">Giới tính</th>
                      <th className="py-2 px-3">Ngày sinh</th>
                      <th className="py-2 px-3">Tổ</th>
                      <th className="py-2 px-3">Chức vụ</th>
                      <th className="py-2 px-3">SĐT Phụ huynh</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {previewList.slice(0, 50).map((s, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <td className="py-2 px-3 text-slate-400">{idx + 1}</td>
                        <td className="py-2 px-3 font-bold text-slate-900 dark:text-white">
                          {s.full_name}
                        </td>
                        <td className="py-2 px-3">{s.gender}</td>
                        <td className="py-2 px-3">{s.dob || '—'}</td>
                        <td className="py-2 px-3">{s.group_name}</td>
                        <td className="py-2 px-3">{s.role_in_class}</td>
                        <td className="py-2 px-3">{s.parent_phone || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer Modal */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 font-semibold text-slate-600 hover:text-slate-800 dark:text-slate-400 rounded-xl"
          >
            Đóng
          </button>

          {previewList.length > 0 && (
            <button
              onClick={handleConfirmImport}
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2.5 font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-md transition disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              <span>{loading ? 'Đang nạp...' : `Xác Nhận Nạp ${previewList.length} Học Sinh`}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

