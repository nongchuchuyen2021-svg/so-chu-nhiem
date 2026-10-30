import {
  getLocalClasses,
  saveLocalClasses,
  getCurrentClassId,
  setCurrentClassId,
  getLocalStudents,
  saveLocalStudents,
  seedSampleStudents,
  clearClassStudents,
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
  classes: {
    list: async () => {
      try {
        return await fetchJson('/classes');
      } catch (err) {
        return getLocalClasses();
      }
    },
    getCurrent: () => {
      const list = getLocalClasses();
      const currentId = getCurrentClassId();
      return list.find((c) => c.id === currentId) || list[0];
    },
    setCurrent: (classId) => {
      setCurrentClassId(classId);
    },
    create: async (data) => {
      const list = getLocalClasses();
      const newClass = {
        id: Date.now(),
        name: data.name,
        grade: Number(data.grade) || 10,
        school_year: data.school_year || '2025-2026',
      };
      list.push(newClass);
      saveLocalClasses(list);
      return newClass;
    },
    update: async (id, data) => {
      let list = getLocalClasses();
      list = list.map((c) => (c.id === Number(id) ? { ...c, ...data } : c));
      saveLocalClasses(list);
      return list.find((c) => c.id === Number(id));
    },
  },

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
          let fullName = 'Cô Nguyễn Mai Phương (GVCN)';
          if (u === 'canbo') {
            role = 'student';
            fullName = 'Trần Khánh Linh (Lớp phó học tập)';
          } else if (u === 'ph01') {
            role = 'parent';
            fullName = 'Bác Nam (Phụ huynh em Hoàng Nam)';
          }

          const currentClass = api.classes.getCurrent();
          const mockUser = {
            id: 1,
            username: u,
            full_name: fullName,
            role,
            class: currentClass,
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
        const currentClass = api.classes.getCurrent();
        const students = getLocalStudents(currentClass.id);
        const todayStr = new Date().toISOString().split('T')[0];
        const session = new Date().getHours() < 12 ? 'sang' : 'chieu';
        const attendance = getLocalAttendance(todayStr, session, currentClass.id);

        const absentP = attendance.filter((r) => r.status === 'P').length;
        const absentK = attendance.filter((r) => r.status === 'K').length;
        const late = attendance.filter((r) => r.status === 'M').length;
        const present = Math.max(0, students.length - absentP - absentK);
        const rate = students.length > 0 ? Math.round((present / students.length) * 100) : 100;

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

        const chartData = [
          { day: 'T2', co_mat: Math.max(0, students.length - 1), vang: 1, muon: 0, ty_le: 97.5 },
          { day: 'T3', co_mat: Math.max(0, students.length - 2), vang: 2, muon: 1, ty_le: 95.0 },
          { day: 'T4', co_mat: students.length, vang: 0, muon: 0, ty_le: 100 },
          { day: 'T5', co_mat: Math.max(0, students.length - 1), vang: 1, muon: 2, ty_le: 97.5 },
          { day: 'T6', co_mat: Math.max(0, students.length - 2), vang: 2, muon: 0, ty_le: 95.0 },
          { day: 'T7', co_mat: students.length, vang: 0, muon: 1, ty_le: 100 },
          { day: 'Hôm nay', co_mat: present, vang: absentP + absentK, muon: late, ty_le: rate },
        ];

        return {
          class_name: currentClass.name,
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
            { id: 1, title: `Kiểm tra Giữa HK1 Lớp ${currentClass.name}`, date: '02/11/2026', note: 'Ôn tập trọng tâm chương 1 & 2' },
            { id: 2, title: `Họp Phụ huynh Lớp ${currentClass.name}`, date: '06/11/2026', note: 'Bầu Ban đại diện CMHS, phổ biến Thông tư 15' },
            { id: 3, title: 'Hạn nộp tiền Bảo hiểm Y tế học sinh', date: '10/11/2026', note: 'Báo cáo danh sách nộp về phòng Tài vụ' },
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
        const currentClass = api.classes.getCurrent();
        let list = getLocalStudents(currentClass.id);
        if (params.q) {
          const q = params.q.toLowerCase();
          list = list.filter((s) => s.full_name.toLowerCase().includes(q) || (s.parent_phone && s.parent_phone.includes(q)));
        }
        if (params.group_name && params.group_name !== 'all') {
          list = list.filter((s) => s.group_name === params.group_name);
        }
        if (params.flagged !== undefined && params.flagged) {
          list = list.filter((s) => s.is_flagged_risk);
        }
        return list;
      }
    },
    get: async (id) => {
      try {
        return await fetchJson(`/students/${id}`);
      } catch (err) {
        const currentClass = api.classes.getCurrent();
        const list = getLocalStudents(currentClass.id);
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
        const currentClass = api.classes.getCurrent();
        const list = getLocalStudents(currentClass.id);
        const newStudent = {
          ...data,
          id: Date.now(),
          class_id: currentClass.id,
          group_name: data.group_id ? `Tổ ${data.group_id}` : (data.group_name || 'Tổ 1'),
        };
        list.push(newStudent);
        saveLocalStudents(list, currentClass.id);
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
        const currentClass = api.classes.getCurrent();
        let list = getLocalStudents(currentClass.id);
        list = list.map((s) => (s.id === Number(id) ? { ...s, ...data } : s));
        saveLocalStudents(list, currentClass.id);
        return list.find((s) => s.id === Number(id));
      }
    },
    delete: async (id) => {
      try {
        return await fetchJson(`/students/${id}`, { method: 'DELETE' });
      } catch (err) {
        const currentClass = api.classes.getCurrent();
        let list = getLocalStudents(currentClass.id);
        list = list.filter((s) => s.id !== Number(id));
        saveLocalStudents(list, currentClass.id);
        return { ok: true };
      }
    },
    seedDemo: async () => {
      const currentClass = api.classes.getCurrent();
      return seedSampleStudents(currentClass.id);
    },
    clearAll: async () => {
      const currentClass = api.classes.getCurrent();
      clearClassStudents(currentClass.id);
      return [];
    },
    importList: async (importedStudents) => {
      const currentClass = api.classes.getCurrent();
      let list = getLocalStudents(currentClass.id);
      const startId = Date.now();
      const formatted = importedStudents.map((s, idx) => ({
        id: startId + idx,
        class_id: currentClass.id,
        full_name: s.full_name || s['Họ và tên'] || 'Học sinh',
        gender: s.gender || s['Giới tính'] || 'Nam',
        dob: s.dob || s['Ngày sinh'] || '',
        role_in_class: s.role_in_class || s['Chức vụ'] || 'Thành viên',
        group_name: s.group_name || s['Tổ'] || `Tổ ${(idx % 4) + 1}`,
        parent_name: s.parent_name || s['Phụ huynh'] || '',
        parent_phone: s.parent_phone || s['SĐT Phụ huynh'] || '',
        parent_job: s.parent_job || s['Nghề nghiệp'] || '',
        address: s.address || s['Địa chỉ'] || '',
        family_background: s.family_background || s['Hoàn cảnh'] || '',
        private_notes: s.private_notes || s['Ghi chú'] || '',
        is_flagged_risk: Boolean(s.is_flagged_risk),
        risk_reason: s.risk_reason || '',
      }));

      list = [...list, ...formatted];
      saveLocalStudents(list, currentClass.id);
      return list;
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
        const currentClass = api.classes.getCurrent();
        return getLocalAttendance(dateStr, session, currentClass.id);
      }
    },
    save: async (dateStr, session, records) => {
      try {
        return await fetchJson('/attendance', {
          method: 'POST',
          body: JSON.stringify({ date: dateStr, session, records }),
        });
      } catch (err) {
        const currentClass = api.classes.getCurrent();
        return saveLocalAttendance(dateStr, session, records, currentClass.id);
      }
    },
    summary: async (days = 30) => {
      try {
        return await fetchJson(`/attendance/summary?days=${days}`);
      } catch (err) {
        const currentClass = api.classes.getCurrent();
        const students = getLocalStudents(currentClass.id);
        const atRisk = students
          .filter((s) => s.is_flagged_risk)
          .map((s) => ({
            student_id: s.id,
            name: s.full_name,
            total_absent: 3,
            p: 2,
            k: 1,
            m: 1,
          }));

        return {
          period_days: days,
          total_students: students.length,
          at_risk_count: atRisk.length,
          at_risk_students: atRisk,
        };
      }
    },
  },
};
