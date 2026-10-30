# Cấu hình Firebase (lưu dữ liệu thật + đăng nhập Google)

Khi có đủ 4 biến `VITE_FIREBASE_*`, web tự chuyển sang chế độ **đám mây**: đăng nhập bằng Google hoặc Gmail + mật khẩu,
dữ liệu từng giáo viên nằm ở Firestore (`users/{uid}/kv/...`) và dùng được trên mọi thiết bị. Thiếu biến thì web chạy chế độ dùng thử.

1. https://console.firebase.google.com → **Add project** (tắt Google Analytics cũng được).
2. **Build → Authentication → Get started** → bật **Google** và **Email/Password**.
3. **Build → Firestore Database → Create database** (production mode, chọn vùng gần Việt Nam, vd. `asia-southeast1`).
4. Tab **Rules** của Firestore: dán nội dung file `firestore.rules` rồi **Publish**.
5. **Project settings (bánh răng) → Your apps → Web (</>)** → đăng ký app, copy 4 giá trị: `apiKey`, `authDomain`, `projectId`, `appId`.
6. **Authentication → Settings → Authorized domains** → thêm tên miền Vercel của bạn (vd. `frontend-liart-gamma-29.vercel.app`).
7. Vercel → project → **Settings → Environment Variables**: thêm 4 biến trong `frontend/.env.example`, rồi **Redeploy**.

Chạy trên máy: sao chép `frontend/.env.example` thành `frontend/.env.local`, điền giá trị, `npm run dev`.

Lưu ý: `apiKey` của Firebase web không phải bí mật; an toàn dữ liệu do `firestore.rules` đảm nhiệm.
