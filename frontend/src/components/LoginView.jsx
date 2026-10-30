import React, { useState } from 'react';
import {
  BookOpen,
  Lock,
  User,
  ShieldCheck,
  UserCheck,
  Users,
  Sparkles,
  ArrowRight,
  AlertCircle,
  Mail,
} from 'lucide-react';
import { api } from '../api';
import { BRAND_NAME, BRAND_TAGLINE } from '../brand';

export default function LoginView({ onLoginSuccess, demo }) {
  const [username, setUsername] = useState('gvcn');
  const [password, setPassword] = useState('Demo@12345');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState('login'); // 'login' | 'register'
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password2, setPassword2] = useState('');

  const switchTab = (t) => {
    setTab(t);
    setError(null);
    setPassword('');
    setPassword2('');
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      if (tab === 'register') {
        if (password !== password2) throw new Error('Mật khẩu nhập lại không khớp');
        onLoginSuccess(await api.auth.register(email, password, fullName));
        return;
      }
      const user = await api.auth.login(username, password);
      onLoginSuccess(user);
    } catch (err) {
      console.error('Đăng nhập thất bại:', err);
      setError(err.message || 'Sai tên đăng nhập hoặc mật khẩu');
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = async (u, p) => {
    setUsername(u);
    setPassword(p);
    try {
      setLoading(true);
      setError(null);
      const user = await api.auth.login(u, p);
      onLoginSuccess(user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-4 bg-gradient-to-br from-slate-900 via-teal-950 to-slate-900 text-slate-100">
      <div className="w-full max-w-md space-y-6">
        {/* Logo và Tiêu đề */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 mx-auto flex items-center justify-center text-white shadow-xl shadow-emerald-500/20">
            <BookOpen className="w-8 h-8" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            {BRAND_NAME}
          </h1>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-800 text-xs font-semibold text-emerald-300">
            <Sparkles className="w-3.5 h-3.5" />
            Chuẩn Thông tư 15/2026/TT-BGDĐT & TT22
          </div>
          <p className="text-xs text-slate-400">
            {BRAND_TAGLINE} • nắm tình hình lớp trong 1 phút mỗi ngày
          </p>
        </div>

        {/* Khung Đăng Nhập */}
        <div className="bg-slate-800/80 backdrop-blur-md p-6 sm:p-8 rounded-3xl border border-slate-700/80 shadow-2xl space-y-5">
          {demo && (
            <div className="p-3 rounded-xl bg-amber-950/50 border border-amber-800 text-amber-200 text-[11px] leading-relaxed">
              ⚠️ Bản dùng thử: chưa kết nối máy chủ, dữ liệu chỉ lưu trong trình duyệt này. Không nhập thông tin thật của học sinh.
            </div>
          )}
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-950/50 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-slate-900/80 border border-slate-700">
            {[['login', 'Đăng nhập'], ['register', 'Đăng ký bằng Gmail']].map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => switchTab(key)}
                className={`py-2 rounded-lg text-xs font-bold transition ${
                  tab === key ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {tab === 'register' && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Họ tên giáo viên</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      maxLength={100}
                      placeholder="VD: Cô Nguyễn Mai Phương"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/80 border border-slate-700 text-sm text-white placeholder-slate-500 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Địa chỉ Gmail</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      placeholder="ten.cua.ban@gmail.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/80 border border-slate-700 text-sm text-white placeholder-slate-500 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
                    />
                  </div>
                </div>
              </>
            )}

            {tab === 'login' && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Tên đăng nhập hoặc Gmail
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  placeholder="email@gmail.com hoặc gvcn / canbo / ph01"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/80 border border-slate-700 text-sm text-white placeholder-slate-500 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
                />
              </div>
            </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Mật khẩu
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  placeholder={tab === 'register' ? 'Tối thiểu 8 ký tự' : '••••••••'}
                  minLength={tab === 'register' ? 8 : undefined}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/80 border border-slate-700 text-sm text-white placeholder-slate-500 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
                />
              </div>
            </div>

            {tab === 'register' && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Nhập lại mật khẩu</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password2}
                    onChange={(e) => setPassword2(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/80 border border-slate-700 text-sm text-white placeholder-slate-500 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
                  />
                </div>
                <p className="text-[10px] text-slate-500 mt-1.5">
                  Chưa xác minh hộp thư Gmail; hãy dùng đúng Gmail của bạn để khỏi quên tài khoản.
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm shadow-lg shadow-emerald-900/30 transition transform active:scale-98 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <span>{loading ? 'Đang xử lý...' : tab === 'register' ? 'Tạo tài khoản' : 'Đăng Nhập'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Dùng thử nhanh 1-Chạm */}
          {tab === 'login' && (
          <div className="pt-4 border-t border-slate-700/60 space-y-2.5">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 text-center">
              Dùng thử nhanh (1-Chạm)
            </p>

            <div className="grid grid-cols-1 gap-2">
              <button
                type="button"
                onClick={() => quickLogin('gvcn', 'Demo@12345')}
                className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/60 hover:bg-slate-900 border border-slate-700 text-left transition group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-emerald-950 text-emerald-400 flex items-center justify-center">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white group-hover:text-emerald-400 transition">
                      Giáo viên chủ nhiệm (tài khoản mẫu)
                    </p>
                    <p className="text-[10px] text-slate-400">Toàn quyền xem hồ sơ, điểm danh, báo cáo</p>
                  </div>
                </div>
                <span className="text-xs text-emerald-400 font-bold opacity-0 group-hover:opacity-100 transition">
                  Vào →
                </span>
              </button>

              <button
                type="button"
                onClick={() => quickLogin('canbo', 'Demo@12345')}
                className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/60 hover:bg-slate-900 border border-slate-700 text-left transition group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-blue-950 text-blue-400 flex items-center justify-center">
                    <UserCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white group-hover:text-blue-400 transition">
                      Cán bộ lớp (Lớp phó học tập)
                    </p>
                    <p className="text-[10px] text-slate-400">Chỉ điểm danh & nề nếp, ẩn thông tin bảo mật</p>
                  </div>
                </div>
                <span className="text-xs text-blue-400 font-bold opacity-0 group-hover:opacity-100 transition">
                  Vào →
                </span>
              </button>
            </div>
          </div>
          )}
        </div>

        {/* Chân trang */}
        <p className="text-center text-[11px] text-slate-500">
          Hệ thống Quản lý Chủ nhiệm THPT • Bảo mật & Tuân thủ Luật Bảo vệ dữ liệu cá nhân
        </p>
      </div>
    </div>
  );
}

