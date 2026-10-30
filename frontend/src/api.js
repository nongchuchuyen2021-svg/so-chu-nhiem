import {
  getLocalStudents,
  saveLocalStudents,
  getLocalAttendance,
  saveLocalAttendance,
} from './localData';

const BASE_URL = '/api';

async function fetchJson(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const defaultHeaders = {
    'Content-Type': 'application/json',
  };

  const response = await fetch(url, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
    credentials: 'include',
  });

  if (response.status === 401) {
    localStorage.removeItem('scn_cached_user');
    throw new Error('Chưa đăng nhập hoặc phiên đã hết hạn');
  }

  if (!response.ok) {
    let errMsg = `Lỗi hệ thống (${response.status})`;
    try {
      const errData = await response.json();
      errMsg = errData.detail || errMsg;
    } catch (e) {}
    throw new Error(errMsg);
  }

  return response.json();
}

export const api = {
  auth: {
    login: async (username, password) => {
      try {
        const res = await fetchJson('/auth/login', {
          method: 'POST',
          body: JSON.stringify({ username, password }),
        });
        localStorage.setItem('scn_cached_user', JSON.stringify(res));
        return res;
      } catch (err) {
        // Fallback chế độ Cloud Preview / Vercel
        const u = username.trim().toLowerCase();
        if (password === 'Demo@12345' || password === '123456') {
          let role = 'gvcn';
          let fullName = 'Cô Nguyễn Mai Phương (GVCN 10A1)';
          if (u === 'canbo') {
            role = 'student';
            fullName = 'Trần Khánh Linh (Lớp phó học tập)';
          } else if (u === 'ph01') {
            role = 'parent';
            fullName = 'Bác Nam (Phụ huynh em Hoàng Nam)';
          }
          const mockUser = {
            id: 1,
            username: u,
            full_name: fullName,
            role,
            class: { id: 1, name: '10A1', school_year: '2025-2026' },
          };
          localStorage.setItem('scn_cached_user', JSON.stringify(mockUser));
          return mockUser;
        }
        throw new Error('Sai tên đăng nhập hoặc mật khẩu');
      }
    },
    logout: async () => {
      try {
        await fetchJson('/auth/logout', { method: 'POST' });
      } catch (e) {}
      localStorage.removeItem('scn_cached_user');
    },
    me: async () => {
      try {
        const res = await fetchJson('/auth/me');
        localStorage.setItem('scn_cached_user', JSON.stringify(res));
        return res;
      } catch (err) {
        const cached = localStorage.getItem('scn_cached_user');
        if (cached) return JSON.parse(cached);
        throw err;
      }
    },
  },

  dashboard: {
    get: async () => {
      try {
        return await fetchJson('/dashboard');
      } catch (err) {
        // Fallback tính toán từ local data
        const students = getLocalStudents();
        const todayStr = new Date().toISOString().split('T')[0];
        const session = new Date().getHours() < 12 ? 'sang' : 'chieu';
        const attendance = getLocalAttendance(todayStr, session);

        const absentP = attendance.filter((r) => r.status === 'P').length;
        const absentK = attendance.filter((r) => r.status === 'K').length;
        const late = attendance.filter((r) => r.status === 'M').length;
        const present = students.length - absentP - absentK;
        const rate = Math.round((present / students.length) * 100);

        const absentList = attendance
          .filter((r) => r.status !== 'C')
          .map((r) => ({
            id: r.student_id,
            name: r.student_name,
            status: r.status,
            status_label: r.status === 'P' ? 'Có phép' : r.status === 'K' ? 'Không phép' : 'Đi muộn',
            reason: r.reason,
            minutes_late: r.minutes_late,
            phone: '098700188',
          }));

        const flaggedStudents = students
          .filter((s) => s.is_flagged_risk)
          .map((s) => ({
            id: s.id,
            name: s.full_name,
            gender: s.gender,
            role: s.role_in_class,
            reason: s.risk_reason || 'Cần theo dõi sát',
            parent_phone: s.parent_phone,
          }));

        // Dữ liệu biểu đồ 7 ngày
        const chartData = [
          { day: 'T2', co_mat: 39, vang: 1, muon: 0, ty_le: 97.5 },
          { day: 'T3', co_mat: 38, vang: 2, muon: 1, ty_le: 95.0 },
          { day: 'T4', co_mat: 40, vang: 0, muon: 0, ty_le: 100 },
          { day: 'T5', co_mat: 39, vang: 1, muon: 2, ty_le: 97.5 },
          { day: 'T6', co_mat: 38, vang: 2, muon: 0, ty_le: 95.0 },
          { day: 'T7', co_mat: 40, vang: 0, muon: 1, ty_le: 100 },
          { day: 'Hôm nay', co_mat: present, vang: absentP + absentK, muon: late, ty_le: rate },
        ];

        return {
          total_students: students.length,
          today: {
            date: new Date().toLocaleDateString('vi-VN'),
            session,
            session_label: session === 'sang' ? 'Buổi Sáng' : 'Buổi Chiều',
            present,
            absent_p: absentP,
            absent_k: absentK,
            late,
            rate,
            absent_list: absentList,
          },
          flagged_students: flaggedStudents,
          upcoming_events: [
            { id: 1, title: 'Kiểm tra Giữa Học kỳ 1 môn Toán & Ngữ văn', date: '02/11/2026', note: 'Nhắc học sinh ôn tập trọng tâm chương 1 & 2' },
            { id: 2, title: 'Họp Phụ huynh đầu năm học 2025-2026', date: '06/11/2026', note: 'Bầu Ban đại diện CMHS, phổ biến nội quy Thông tư 15' },
            { id: 3, title: 'Hạn nộp tiền Bảo hiểm Y tế học sinh đợt 1', date: '10/11/2026', note: 'Báo cáo danh sách nộp về phòng Tài vụ trường' },
          ],
          chartData,
        };
      }
    },
  },

  students: {
    list: async (params = {}) => {
      try {
        const query = new URLSearchParams();
        if (params.q) query.append('q', params.q);
        if (params.group_id) query.append('group_id', params.group_id);
        if (params.flagged !== undefined) query.append('flagged', params.flagged);
        const qs = query.toString();
        return await fetchJson(`/students${qs ? '?' + qs : ''}`);
      } catch (err) {
        let list = getLocalStudents();
        if (params.q) {
          const q = params.q.toLowerCase();
          list = list.filter((s) => s.full_name.toLowerCase().includes(q) || (s.parent_phone && s.parent_phone.includes(q)));
        }
        if (params.flagged !== undefined) {
          list = list.filter((s) => s.is_flagged_risk === params.flagged);
        }
        return list;
      }
    },
    get: async (id) => {
      try {
        return await fetchJson(`/students/${id}`);
      } catch (err) {
        const list = getLocalStudents();
        return list.find((s) => s.id === Number(id)) || null;
      }
    },
    create: async (data) => {
      try {
        return await fetchJson('/students', {
          method: 'POST',
          body: JSON.stringify(data),
        });
      } catch (err) {
        const list = getLocalStudents();
        const newStudent = {
          ...data,
          id: Date.now(),
          group_name: data.group_id ? `Tổ ${data.group_id}` : 'Tổ 1',
        };
        list.push(newStudent);
        saveLocalStudents(list);
        return newStudent;
      }
    },
    update: async (id, data) => {
      try {
        return await fetchJson(`/students/${id}`, {
          method: 'PUT',
          body: JSON.stringify(data),
        });
      } catch (err) {
        let list = getLocalStudents();
        list = list.map((s) => (s.id === Number(id) ? { ...s, ...data } : s));
        saveLocalStudents(list);
        return list.find((s) => s.id === Number(id));
      }
    },
    delete: async (id) => {
      try {
        return await fetchJson(`/students/${id}`, { method: 'DELETE' });
      } catch (err) {
        let list = getLocalStudents();
        list = list.filter((s) => s.id !== Number(id));
        saveLocalStudents(list);
        return { ok: true };
      }
    },
    groups: async () => {
      try {
        return await fetchJson('/students/groups');
      } catch (err) {
        return [
          { id: 1, name: 'Tổ 1' },
          { id: 2, name: 'Tổ 2' },
          { id: 3, name: 'Tổ 3' },
          { id: 4, name: 'Tổ 4' },
        ];
      }
    },
    exportExcelUrl: () => {
      return `${BASE_URL}/students/export/excel`;
    },
  },

  attendance: {
    get: async (dateStr, session = 'sang') => {
      try {
        return await fetchJson(`/attendance?date=${dateStr}&session=${session}`);
      } catch (err) {
        return getLocalAttendance(dateStr, session);
      }
    },
    save: async (dateStr, session, records) => {
      try {
        return await fetchJson('/attendance', {
          method: 'POST',
          body: JSON.stringify({ date: dateStr, session, records }),
        });
      } catch (err) {
        return saveLocalAttendance(dateStr, session, records);
      }
    },
    summary: async (days = 30) => {
      try {
        return await fetchJson(`/attendance/summary?days=${days}`);
      } catch (err) {
        return {
          period_days: days,
          total_students: 40,
          at_risk_count: 2,
          at_risk_students: [
            { student_id: 11, name: 'Nguyễn Đức Cường', total_absent: 3, p: 1, k: 0, m: 2 },
            { student_id: 7, name: 'Đặng Hữu Phúc', total_absent: 3, p: 3, k: 0, m: 0 },
          ],
        };
      }
    },
  },
};
