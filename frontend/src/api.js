// Bộ API client giao tiếp với Backend FastAPI có hỗ trợ Local-First cache

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
    credentials: 'include', // gửi kèm cookie HttpOnly scn_token
  });

  if (response.status === 401) {
    // Phiên hết hạn hoặc chưa đăng nhập
    localStorage.removeItem('scn_cached_user');
    throw new Error('Chưa đăng nhập hoặc phiên đã hết hạn');
  }

  if (!response.ok) {
    let errMsg = `Lỗi hệ thống (${response.status})`;
    try {
      const errData = await response.json();
      errMsg = errData.detail || errMsg;
    } catch (e) {
      // bỏ qua nếu không phải JSON
    }
    throw new Error(errMsg);
  }

  return response.json();
}

export const api = {
  auth: {
    login: async (username, password) => {
      const res = await fetchJson('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      });
      localStorage.setItem('scn_cached_user', JSON.stringify(res));
      return res;
    },
    logout: async () => {
      try {
        await fetchJson('/auth/logout', { method: 'POST' });
      } finally {
        localStorage.removeItem('scn_cached_user');
      }
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
      return fetchJson('/dashboard');
    },
  },

  students: {
    list: async (params = {}) => {
      const query = new URLSearchParams();
      if (params.q) query.append('q', params.q);
      if (params.group_id) query.append('group_id', params.group_id);
      if (params.flagged !== undefined) query.append('flagged', params.flagged);
      const qs = query.toString();
      return fetchJson(`/students${qs ? '?' + qs : ''}`);
    },
    get: async (id) => {
      return fetchJson(`/students/${id}`);
    },
    create: async (data) => {
      return fetchJson('/students', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    update: async (id, data) => {
      return fetchJson(`/students/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },
    delete: async (id) => {
      return fetchJson(`/students/${id}`, {
        method: 'DELETE',
      });
    },
    groups: async () => {
      return fetchJson('/students/groups');
    },
    exportExcelUrl: () => {
      return `${BASE_URL}/students/export/excel`;
    },
  },

  attendance: {
    get: async (dateStr, session = 'sang') => {
      return fetchJson(`/attendance?date=${dateStr}&session=${session}`);
    },
    save: async (dateStr, session, records) => {
      return fetchJson('/attendance', {
        method: 'POST',
        body: JSON.stringify({
          date: dateStr,
          session,
          records,
        }),
      });
    },
    summary: async (days = 30) => {
      return fetchJson(`/attendance/summary?days=${days}`);
    },
  },
};

