import {
  INITIAL_STUDENTS_10A1,
  getLocalClasses,
  saveLocalClasses,
  getCurrentClassId,
  setCurrentClassId,
  getLocalStudents,
  saveLocalStudents,
  seedSampleStudents,
  getLocalAttendance,
  saveLocalAttendance,
  peekAttendance,
} from './localData';
import { cloudEnabled, cloud, cloudUser } from './cloud';

const BASE_URL = '/api';

// Hai chế độ, chọn MỘT lần khi tải trang và không bao giờ tự chuyển giữa chừng:
//  - 'server': có máy chủ (FastAPI). Mọi lỗi được báo thẳng cho người dùng, KHÔNG lưu tạm vào trình duyệt.
//  - 'cloud' : Firebase (Google/Gmail + Firestore). Dữ liệu từng giáo viên lưu trên đám mây, đồng bộ giữa các thiết bị.
//  - 'demo'  : không có máy chủ (vd. bản xem thử trên Vercel). Dữ liệu chỉ nằm trong trình duyệt này.
let modePromise = null;
export function detectMode() {
  if (cloudEnabled) return Promise.resolve('cloud');
  if (!modePromise) {
    modePromise = fetch(`${BASE_URL}/health`, { cache: 'no-store' })
      .then(async (r) => {
        if (!r.ok) return 'demo';
        const body = await r.json().catch(() => null); // Vercel trả HTML nên không parse được
        return body && body.status === 'ok' ? 'server' : 'demo';
      })
      .catch(() => 'demo');
  }
  return modePromise;
}

const route = async (server, local) => ((await detectMode()) === 'server' ? server() : local());

async function fetchJson(endpoint, options = {}) {
  let response;
  try {
    response = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers: { 'Content-Type': 'application/json', ...options.headers },
      credentials: 'include',
    });
  } catch (e) {
    throw new Error('Không kết nối được máy chủ. Dữ liệu CHƯA được lưu, vui lòng thử lại.');
  }

  if (!response.ok) {
    let msg = `Lỗi hệ thống (${response.status})`;
    try {
      const body = await response.json();
      if (typeof body.detail === 'string') msg = body.detail;
      else if (Array.isArray(body.detail)) msg = 'Dữ liệu không hợp lệ: ' + body.detail.map((d) => d.msg).join('; ');
    } catch (e) {}

    if (response.status === 401 && !endpoint.startsWith('/auth/')) {
      window.dispatchEvent(new Event('scn:unauthorized'));
      throw new Error('Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại. Dữ liệu CHƯA được lưu.');
    }
    throw new Error(msg);
  }
  return response.json();
}

const json = (method, data) => ({ method, body: JSON.stringify(data) });

// ---------------------------------------------------------------- Chế độ dùng thử (localStorage)
const DEMO_ACCOUNTS = {
  gvcn: { role: 'gvcn', full_name: 'Cô Nguyễn Mai Phương (GVCN)' },
  canbo: { role: 'student', full_name: 'Trần Khánh Linh (Lớp phó học tập)' },
  ph01: { role: 'parent', full_name: 'Bác Nam (Phụ huynh em Hoàng Nam)' },
};
const DEMO_PASSWORD = 'Demo@12345';

// Tài khoản đăng ký ở chế độ dùng thử: chỉ nằm trong trình duyệt này (mật khẩu băm SHA-256).
const GMAIL_RE = /^[a-z0-9][a-z0-9._+-]*@gmail\.com$/;
const sha256 = async (text) => {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
};
const getLocalUsers = () => {
  try {
    return JSON.parse(localStorage.getItem('scn_users') || '{}');
  } catch (e) {
    return {};
  }
};
const saveLocalUsers = (users) => localStorage.setItem('scn_users', JSON.stringify(users));

const localClassesWithCurrent = () => {
  const list = getLocalClasses();
  const currentId = list.some((c) => c.id === getCurrentClassId()) ? getCurrentClassId() : list[0]?.id;
  return list.map((c) => ({ ...c, is_current: c.id === currentId }));
};
const localCurrentClass = () => localClassesWithCurrent().find((c) => c.is_current);
const cloudMe = (fbUser) => cloudUser(fbUser, localCurrentClass());

const dayStr = (offset) => {
  const d = new Date();
  d.setDate(d.getDate() - offset);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
const WEEKDAY = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

// Biểu đồ chuyên cần 7 ngày từ điểm danh đã lưu (ngày chưa điểm danh thì bỏ qua)
function realChart(classId, total, today) {
  const points = [];
  for (let off = 6; off >= 1; off--) {
    const recs = peekAttendance(dayStr(off), 'chieu', classId) || peekAttendance(dayStr(off), 'sang', classId);
    if (!recs) continue;
    const vang = recs.filter((r) => r.status === 'P' || r.status === 'K').length;
    const muon = recs.filter((r) => r.status === 'M').length;
    const base = recs.length || total;
    points.push({
      day: WEEKDAY[new Date(dayStr(off)).getDay()],
      co_mat: Math.max(0, base - vang),
      vang,
      muon,
      ty_le: base ? Math.round(((base - vang) / base) * 1000) / 10 : 100,
    });
  }
  points.push({ day: 'Hôm nay', co_mat: today.present, vang: today.absentP + today.absentK, muon: today.late, ty_le: today.rate });
  return points;
}

// Học sinh vắng từ 3 buổi trở lên trong `days` ngày (cùng quy tắc với máy chủ)
function realAtRisk(classId, students, days) {
  const stats = new Map(students.map((s) => [s.id, { student_id: s.id, name: s.full_name, p: 0, k: 0, m: 0, total_absent: 0 }]));
  for (let off = 0; off <= days; off++) {
    ['sang', 'chieu'].forEach((session) => {
      (peekAttendance(dayStr(off), session, classId) || []).forEach((r) => {
        const st = stats.get(r.student_id);
        if (!st) return;
        if (r.status === 'P') { st.p++; st.total_absent++; }
        else if (r.status === 'K') { st.k++; st.total_absent++; }
        else if (r.status === 'M') st.m++;
      });
    });
  }
  return [...stats.values()].filter((s) => s.total_absent >= 3).sort((a, b) => b.total_absent - a.total_absent);
}

const local = {
  dashboard() {
    const currentClass = localCurrentClass();
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
        phone: students.find((s) => s.id === r.student_id)?.parent_phone || '',
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

    const isSample = currentClass.id <= 4; // 4 lớp mẫu có số liệu giả; lớp của giáo viên chỉ dùng số liệu thật
    const chartData = isSample
      ? [
          { day: 'T2', co_mat: Math.max(0, students.length - 1), vang: 1, muon: 0, ty_le: 97.5 },
          { day: 'T3', co_mat: Math.max(0, students.length - 2), vang: 2, muon: 1, ty_le: 95.0 },
          { day: 'T4', co_mat: students.length, vang: 0, muon: 0, ty_le: 100 },
          { day: 'T5', co_mat: Math.max(0, students.length - 1), vang: 1, muon: 2, ty_le: 97.5 },
          { day: 'T6', co_mat: Math.max(0, students.length - 2), vang: 2, muon: 0, ty_le: 95.0 },
          { day: 'T7', co_mat: students.length, vang: 0, muon: 1, ty_le: 100 },
          { day: 'Hôm nay', co_mat: present, vang: absentP + absentK, muon: late, ty_le: rate },
        ]
      : realChart(currentClass.id, students.length, { present, absentP, absentK, late, rate });

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
      upcoming_events: !isSample ? [] : [
        { id: 1, title: `Kiểm tra Giữa HK1 Lớp ${currentClass.name}`, date: '02/11/2026', note: 'Ôn tập trọng tâm chương 1 & 2' },
        { id: 2, title: `Họp Phụ huynh Lớp ${currentClass.name}`, date: '06/11/2026', note: 'Bầu Ban đại diện CMHS, phổ biến Thông tư 15' },
        { id: 3, title: 'Hạn nộp tiền Bảo hiểm Y tế học sinh', date: '10/11/2026', note: 'Báo cáo danh sách nộp về phòng Tài vụ' },
      ],
      chart_data: chartData,
    };
  },

  studentsList(params = {}) {
    let list = getLocalStudents(localCurrentClass().id);
    if (params.q) {
      const q = params.q.toLowerCase();
      list = list.filter((s) => s.full_name.toLowerCase().includes(q) || (s.parent_phone && s.parent_phone.includes(q)));
    }
    if (params.group_name && params.group_name !== 'all') list = list.filter((s) => s.group_name === params.group_name);
    if (params.flagged) list = list.filter((s) => s.is_flagged_risk);
    return list;
  },

  importList(importedStudents, replace) {
    const cls = localCurrentClass();
    const startId = Date.now();
    const formatted = importedStudents.map((s, idx) => ({
      id: startId + idx,
      class_id: cls.id,
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
    const list = [...(replace ? [] : getLocalStudents(cls.id)), ...formatted];
    saveLocalStudents(list, cls.id);
    return list;
  },

  attendanceSummary(days) {
    const cls = localCurrentClass();
    const students = getLocalStudents(cls.id);
    const atRisk =
      cls.id <= 4
        ? students
            .filter((s) => s.is_flagged_risk)
            .map((s) => ({ student_id: s.id, name: s.full_name, total_absent: 3, p: 2, k: 1, m: 1 }))
        : realAtRisk(cls.id, students, days);
    return { period_days: days, total_students: students.length, at_risk_count: atRisk.length, at_risk_students: atRisk };
  },
};

// ---------------------------------------------------------------- API công khai
export const api = {
  mode: detectMode,

  classes: {
    list: () => route(() => fetchJson('/classes'), localClassesWithCurrent),
    setCurrent: (classId) =>
      route(
        () => fetchJson(`/classes/${classId}/select`, { method: 'POST' }),
        () => setCurrentClassId(classId)
      ),
    create: (data) =>
      route(
        () => fetchJson('/classes', json('POST', data)),
        () => {
          const list = getLocalClasses();
          const newClass = {
            id: Date.now(),
            name: data.name,
            grade: Number(data.grade) || 10,
            school_year: data.school_year || '2025-2026',
          };
          saveLocalClasses([...list, newClass]);
          return newClass;
        }
      ),
    update: (id, data) =>
      route(
        () => fetchJson(`/classes/${id}`, json('PUT', data)),
        () => {
          const list = getLocalClasses().map((c) => (c.id === Number(id) ? { ...c, ...data } : c));
          saveLocalClasses(list);
          return list.find((c) => c.id === Number(id));
        }
      ),
  },

  auth: {
    login: (username, password) =>
      cloudEnabled
        ? cloud.login(username, password).then(cloudMe)
        : route(
        () => fetchJson('/auth/login', json('POST', { username, password })),
        async () => {
          // Bản xem thử không có máy chủ: 3 tài khoản dùng thử công khai + tài khoản đã đăng ký trên trình duyệt này.
          const u = username.trim().toLowerCase();
          let acc = DEMO_ACCOUNTS[u] && password === DEMO_PASSWORD ? DEMO_ACCOUNTS[u] : null;
          const registered = getLocalUsers()[u];
          if (!acc && registered && registered.hash === (await sha256(password))) {
            acc = { role: 'gvcn', full_name: registered.full_name };
          }
          if (!acc) throw new Error('Sai tên đăng nhập hoặc mật khẩu');
          const user = { id: 1, username: u, ...acc, class: localCurrentClass() };
          localStorage.setItem('scn_cached_user', JSON.stringify(user));
          return user;
        }
      ),
    register: (email, password, full_name) =>
      cloudEnabled
        ? (async () => {
            const u = email.trim().toLowerCase();
            const name = full_name.trim().replace(/\s+/g, ' ');
            if (!GMAIL_RE.test(u)) throw new Error('Vui lòng nhập địa chỉ Gmail hợp lệ (…@gmail.com)');
            if (!name) throw new Error('Vui lòng nhập họ tên giáo viên');
            if (password.length < 8) throw new Error('Mật khẩu tối thiểu 8 ký tự');
            return cloudMe(await cloud.register(u, password, name));
          })()
        : route(
        () => fetchJson('/auth/register', json('POST', { email, password, full_name })),
        async () => {
          const u = email.trim().toLowerCase();
          const name = full_name.trim().replace(/\s+/g, ' ');
          if (!GMAIL_RE.test(u)) throw new Error('Vui lòng nhập địa chỉ Gmail hợp lệ (…@gmail.com)');
          if (!name) throw new Error('Vui lòng nhập họ tên giáo viên');
          if (password.length < 8) throw new Error('Mật khẩu tối thiểu 8 ký tự');
          const users = getLocalUsers();
          if (users[u]) throw new Error('Gmail này đã được đăng ký, hãy đăng nhập');
          users[u] = { full_name: name, hash: await sha256(password) };
          saveLocalUsers(users);
          const user = { id: 1, username: u, role: 'gvcn', full_name: name, class: localCurrentClass() };
          localStorage.setItem('scn_cached_user', JSON.stringify(user));
          return user;
        }
      ),
    google: () => cloud.google().then(cloudMe),
    updateProfile: (full_name) =>
      cloudEnabled
        ? (async () => {
            const name = full_name.trim().replace(/\s+/g, ' ');
            if (!name) throw new Error('Họ tên không được để trống');
            await cloud.saveName(name);
            return { full_name: name };
          })()
        : route(
        () => fetchJson('/auth/profile', json('PUT', { full_name })),
        () => {
          const name = full_name.trim().replace(/\s+/g, ' ');
          if (!name) throw new Error('Họ tên không được để trống');
          const cached = JSON.parse(localStorage.getItem('scn_cached_user') || 'null');
          if (!cached) throw new Error('Chưa đăng nhập');
          const user = { ...cached, full_name: name };
          localStorage.setItem('scn_cached_user', JSON.stringify(user));
          const users = getLocalUsers();
          if (users[user.username]) saveLocalUsers({ ...users, [user.username]: { ...users[user.username], full_name: name } });
          return { ...user, class: localCurrentClass() };
        }
      ),
    logout: () =>
      cloudEnabled
        ? cloud.logout()
        : route(
        async () => {
          try {
            await fetchJson('/auth/logout', { method: 'POST' });
          } catch (e) {}
        },
        () => localStorage.removeItem('scn_cached_user')
      ),
    me: () =>
      cloudEnabled
        ? cloud.restore().then((u) => {
            if (!u) throw new Error('Chưa đăng nhập');
            return cloudMe(u);
          })
        : route(
        () => fetchJson('/auth/me'),
        () => {
          const cached = localStorage.getItem('scn_cached_user');
          if (!cached) throw new Error('Chưa đăng nhập');
          return { ...JSON.parse(cached), class: localCurrentClass() };
        }
      ),
  },

  dashboard: {
    get: () => route(() => fetchJson('/dashboard'), local.dashboard),
  },

  students: {
    list: (params = {}) =>
      route(() => {
        const query = new URLSearchParams();
        if (params.q) query.append('q', params.q);
        if (params.group_id) query.append('group_id', params.group_id);
        if (params.flagged !== undefined) query.append('flagged', params.flagged);
        const qs = query.toString();
        return fetchJson(`/students${qs ? '?' + qs : ''}`);
      }, () => local.studentsList(params)),
    get: (id) =>
      route(
        () => fetchJson(`/students/${id}`),
        () => getLocalStudents(localCurrentClass().id).find((s) => s.id === Number(id)) || null
      ),
    create: (data) =>
      route(
        () => fetchJson('/students', json('POST', data)),
        () => {
          const cls = localCurrentClass();
          const newStudent = {
            ...data,
            id: Date.now(),
            class_id: cls.id,
            group_name: data.group_id ? `Tổ ${data.group_id}` : data.group_name || 'Tổ 1',
          };
          saveLocalStudents([...getLocalStudents(cls.id), newStudent], cls.id);
          return newStudent;
        }
      ),
    update: (id, data) =>
      route(
        () => fetchJson(`/students/${id}`, json('PUT', data)),
        () => {
          const cls = localCurrentClass();
          const list = getLocalStudents(cls.id).map((s) => (s.id === Number(id) ? { ...s, ...data } : s));
          saveLocalStudents(list, cls.id);
          return list.find((s) => s.id === Number(id));
        }
      ),
    delete: (id) =>
      route(
        () => fetchJson(`/students/${id}`, { method: 'DELETE' }),
        () => {
          const cls = localCurrentClass();
          saveLocalStudents(getLocalStudents(cls.id).filter((s) => s.id !== Number(id)), cls.id);
          return { ok: true };
        }
      ),
    // Nạp danh sách (replace=true: thay toàn bộ danh sách cũ). Luôn trả về danh sách đầy đủ của lớp.
    importList: (importedStudents, { replace = false } = {}) =>
      route(
        async () => {
          await fetchJson('/students/import', json('POST', { students: importedStudents, replace }));
          return fetchJson('/students');
        },
        () => local.importList(importedStudents, replace)
      ),
    seedDemo: () =>
      route(
        async () => {
          await fetchJson('/students/import', json('POST', { students: INITIAL_STUDENTS_10A1, replace: true }));
          return fetchJson('/students');
        },
        () => seedSampleStudents(localCurrentClass().id)
      ),
    groups: () =>
      route(() => fetchJson('/students/groups'), () => [1, 2, 3, 4].map((n) => ({ id: n, name: `Tổ ${n}` }))),
    exportExcelUrl: () => `${BASE_URL}/students/export/excel`,
  },

  attendance: {
    get: (dateStr, session = 'sang') =>
      route(
        () => fetchJson(`/attendance?date=${dateStr}&session=${session}`),
        () => getLocalAttendance(dateStr, session, localCurrentClass().id)
      ),
    save: (dateStr, session, records) =>
      route(
        () => fetchJson('/attendance', json('POST', { date: dateStr, session, records })),
        () => saveLocalAttendance(dateStr, session, records, localCurrentClass().id)
      ),
    summary: (days = 30) =>
      route(() => fetchJson(`/attendance/summary?days=${days}`), () => local.attendanceSummary(days)),
  },
};
