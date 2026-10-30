// Firebase: đăng nhập (Google hoặc Gmail + mật khẩu) và lưu dữ liệu của từng giáo viên trên Firestore
// tại users/{uid}/kv/{khóa}. Chỉ bật khi đủ biến môi trường VITE_FIREBASE_* (xem FIREBASE_SETUP.md).
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut,
} from 'firebase/auth';
import { getFirestore, collection, getDocs, doc, setDoc } from 'firebase/firestore';
import { kvSet, setKvPusher, clearDataKeys, isDataKey } from './kv';

const env = import.meta.env;
const config = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  appId: env.VITE_FIREBASE_APP_ID,
};

export const cloudEnabled = Boolean(config.apiKey && config.projectId && config.appId);

let auth = null;
let db = null;
if (cloudEnabled) {
  const app = initializeApp(config);
  auth = getAuth(app);
  db = getFirestore(app);
}

const emitSync = (ok, message = '') =>
  window.dispatchEvent(new CustomEvent('scn:sync', { detail: { ok, message } }));

// Mỗi lần ghi localStorage qua kvSet thì đẩy luôn lên Firestore (Firestore tự xếp hàng khi mất mạng)
if (cloudEnabled) {
  setKvPusher((key, value) => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    setDoc(doc(db, 'users', uid, 'kv', key), { v: value, updated: Date.now() })
      .then(() => emitSync(true))
      .catch((e) => emitSync(false, e.message));
  });
}

const friendlyError = (e) => {
  const map = {
    'auth/invalid-credential': 'Sai Gmail hoặc mật khẩu',
    'auth/wrong-password': 'Sai Gmail hoặc mật khẩu',
    'auth/user-not-found': 'Sai Gmail hoặc mật khẩu',
    'auth/email-already-in-use': 'Gmail này đã được đăng ký, hãy đăng nhập',
    'auth/weak-password': 'Mật khẩu tối thiểu 8 ký tự',
    'auth/popup-closed-by-user': 'Bạn đã đóng cửa sổ đăng nhập Google',
    'auth/popup-blocked': 'Trình duyệt chặn cửa sổ đăng nhập Google, hãy cho phép popup rồi thử lại',
    'auth/too-many-requests': 'Thử quá nhiều lần, vui lòng đợi ít phút',
    'auth/network-request-failed': 'Không có kết nối mạng',
    'auth/unauthorized-domain': 'Tên miền web này chưa được thêm vào Firebase (Authentication → Settings → Authorized domains)',
    'auth/operation-not-allowed': 'Cách đăng nhập này chưa được bật trong Firebase Authentication',
  };
  return new Error(map[e?.code] || e?.message || 'Đăng nhập thất bại');
};
const wrap = (fn) => async (...args) => {
  try {
    return await fn(...args);
  } catch (e) {
    throw friendlyError(e);
  }
};

const schoolYearName = () => {
  const t = new Date();
  const y = t.getMonth() >= 7 ? t.getFullYear() : t.getFullYear() - 1;
  return `${y}-${y + 1}`;
};

const snapshotLocal = () =>
  Object.fromEntries(
    Object.keys(localStorage)
      .filter(isDataKey)
      .map((k) => [k, localStorage.getItem(k)])
  );
const parse = (text, fallback) => {
  try {
    return JSON.parse(text);
  } catch (e) {
    return fallback;
  }
};

// Lớp có học sinh do giáo viên tự nạp trong chế độ dùng thử (bỏ qua lớp mẫu/rỗng)
function migratable(snap) {
  return parse(snap.scn_classes, [])
    .map((cls) => ({ cls, students: parse(snap[`scn_students_class_${cls.id}`], []) }))
    .filter(({ students }) => students.length && !(students.length === 1 && students[0].id === 40));
}

// Chuyển lớp dùng thử vào tài khoản (cấp id mới để không trùng 4 lớp mẫu có id 1-4)
function migrate(snap, items) {
  const base = Date.now();
  const classes = items.map(({ cls, students }, i) => {
    const id = base + i;
    kvSet(`scn_students_class_${id}`, JSON.stringify(students.map((s) => ({ ...s, class_id: id }))));
    Object.keys(snap).forEach((k) => {
      const m = k.match(new RegExp(`^scn_att_${cls.id}_(.+)$`));
      if (m) kvSet(`scn_att_${id}_${m[1]}`, snap[k]);
    });
    return { ...cls, id };
  });
  kvSet('scn_classes', JSON.stringify(classes));
  kvSet('scn_current_class_id', String(classes[0].id));
}

// Tải toàn bộ dữ liệu của giáo viên về localStorage; tài khoản mới: chuyển dữ liệu dùng thử (nếu có và được đồng ý)
// hoặc tạo sẵn 1 lớp TRỐNG
async function hydrate(user) {
  const local = snapshotLocal();
  clearDataKeys();
  const snap = await getDocs(collection(db, 'users', user.uid, 'kv'));
  snap.forEach((d) => {
    if (isDataKey(d.id)) localStorage.setItem(d.id, d.data().v);
  });
  if (localStorage.getItem('scn_classes')) return;

  const items = migratable(local);
  const total = items.reduce((n, i) => n + i.students.length, 0);
  if (items.length && window.confirm(`Trình duyệt này có dữ liệu dùng thử (${items.length} lớp, ${total} học sinh).
Chuyển vào tài khoản của bạn để lưu lâu dài?`)) {
    migrate(local, items);
    return;
  }
  const id = Date.now();
  kvSet('scn_classes', JSON.stringify([{ id, name: '10A1', grade: 10, school_year: schoolYearName() }]));
  kvSet('scn_current_class_id', String(id));
  kvSet(`scn_students_class_${id}`, '[]');
}

export const cloud = {
  // Khôi phục phiên đăng nhập cũ khi mở lại trang; trả về null nếu chưa đăng nhập
  async restore() {
    await auth.authStateReady();
    if (!auth.currentUser) return null;
    await hydrate(auth.currentUser);
    return auth.currentUser;
  },
  google: wrap(async () => {
    const { user } = await signInWithPopup(auth, new GoogleAuthProvider());
    await hydrate(user);
    return user;
  }),
  login: wrap(async (email, password) => {
    const { user } = await signInWithEmailAndPassword(auth, email.trim(), password);
    await hydrate(user);
    return user;
  }),
  register: wrap(async (email, password, fullName) => {
    const { user } = await createUserWithEmailAndPassword(auth, email.trim(), password);
    await updateProfile(user, { displayName: fullName });
    await hydrate(user);
    kvSet('scn_profile', JSON.stringify({ full_name: fullName }));
    return user;
  }),
  async logout() {
    await signOut(auth);
    clearDataKeys();
  },
  saveName(fullName) {
    kvSet('scn_profile', JSON.stringify({ full_name: fullName }));
    return updateProfile(auth.currentUser, { displayName: fullName });
  },
};

// Dạng người dùng mà giao diện đang dùng (xem api.auth.me)
export function cloudUser(fbUser, currentClass) {
  let saved = null;
  try {
    saved = JSON.parse(localStorage.getItem('scn_profile') || 'null');
  } catch (e) {}
  return {
    id: fbUser.uid,
    username: fbUser.email,
    role: 'gvcn',
    full_name: saved?.full_name || fbUser.displayName || '',
    class: currentClass,
  };
}
