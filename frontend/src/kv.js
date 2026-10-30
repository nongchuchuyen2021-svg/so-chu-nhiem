// Kho khóa-giá trị của một giáo viên: luôn ghi vào localStorage (đọc nhanh, đồng bộ) và, khi bật Firebase,
// đẩy thêm lên Firestore (xem cloud.js). Chỉ dữ liệu của giáo viên (lớp, học sinh, điểm danh, hồ sơ) đi qua đây.
let pusher = null;
export const setKvPusher = (fn) => {
  pusher = fn;
};

export function kvSet(key, value) {
  localStorage.setItem(key, value);
  if (pusher) pusher(key, value);
}

const DATA_KEY = /^scn_(classes|current_class_id|profile|students_class_\d+|att_\d+_.+)$/;
export const isDataKey = (key) => DATA_KEY.test(key);

// Xóa dữ liệu lớp của phiên trước trong trình duyệt (tránh lẫn giữa các tài khoản dùng chung máy)
export function clearDataKeys() {
  Object.keys(localStorage)
    .filter(isDataKey)
    .forEach((k) => localStorage.removeItem(k));
}
