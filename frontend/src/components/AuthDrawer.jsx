import { useState, useEffect } from 'react';
import { useUser } from '../context/UserContext';
import { useLanguage } from '../context/LanguageContext';

export default function AuthDrawer() {
  const { drawerOpen, closeAuthDrawer, user, login, logout } = useUser();
  const { t } = useLanguage();
  const [tab, setTab] = useState('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [registerForm, setRegisterForm] = useState({ name: '', email: '', phone: '', password: '', confirm: '' });

  useEffect(() => {
    if (drawerOpen) { setError(''); setSuccess(''); }
  }, [drawerOpen, tab]);

  useEffect(() => {
    if (drawerOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [drawerOpen]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/users/login', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginForm),
      });
      const data = await res.json();
      if (res.ok) login(data.token, data.user);
      else setError(data.error || 'Đăng nhập thất bại.');
    } catch { setError('Không thể kết nối máy chủ.'); }
    finally { setLoading(false); }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (registerForm.password !== registerForm.confirm) { setError('Mật khẩu xác nhận không khớp.'); return; }
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/users/register', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: registerForm.name, email: registerForm.email, phone: registerForm.phone, password: registerForm.password }),
      });
      const data = await res.json();
      if (res.ok) { login(data.token, data.user); }
      else setError(data.error || 'Đăng ký thất bại.');
    } catch { setError('Không thể kết nối máy chủ.'); }
    finally { setLoading(false); }
  };

  const inputCls = "w-full border border-gray-200 px-4 py-3 text-sm font-inter outline-none focus:border-black transition-colors bg-white";
  const labelCls = "block text-[10px] tracking-[0.2em] uppercase font-inter text-warm-gray mb-1.5";

  return (
    <>
      {drawerOpen && <div className="fixed inset-0 bg-black/40 z-[90]" onClick={closeAuthDrawer} />}

      <div className={`fixed top-0 right-0 h-full w-full max-w-sm bg-white z-[95] shadow-2xl transition-transform duration-500 ease-in-out flex flex-col ${drawerOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-gray-100">
          <p className="font-cormorant text-xl font-light tracking-[0.15em] uppercase">
            {user ? 'Tài Khoản' : (tab === 'login' ? 'Đăng Nhập' : 'Đăng Ký')}
          </p>
          <button onClick={closeAuthDrawer} className="hover:opacity-50 transition-opacity text-xl">✕</button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-8 py-6">
          {user ? (
            /* Logged in view */
            <div className="space-y-6">
              <div className="text-center py-4">
                <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-white font-cormorant text-2xl font-light">
                    {user.name?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <p className="font-cormorant text-xl font-light">{user.name}</p>
                <p className="text-xs text-warm-gray font-inter mt-1">{user.email}</p>
                {user.phone && <p className="text-xs text-warm-gray font-inter">{user.phone}</p>}
              </div>

              <div className="space-y-2 border-t border-gray-100 pt-6">
                <button className="w-full text-left px-4 py-3 text-sm font-inter hover:bg-gray-50 transition-colors flex items-center justify-between">
                  <span>Thông tin tài khoản</span>
                  <span className="text-warm-gray">→</span>
                </button>
                <button className="w-full text-left px-4 py-3 text-sm font-inter hover:bg-gray-50 transition-colors flex items-center justify-between">
                  <span>Đơn hàng của tôi</span>
                  <span className="text-warm-gray">→</span>
                </button>
                <button className="w-full text-left px-4 py-3 text-sm font-inter hover:bg-gray-50 transition-colors flex items-center justify-between">
                  <span>Sản phẩm yêu thích</span>
                  <span className="text-warm-gray">→</span>
                </button>
              </div>

              <div className="pt-4 border-t border-gray-100">
                <p className="text-[9px] tracking-[0.2em] uppercase font-inter text-warm-gray mb-1">Thành viên từ</p>
                <p className="text-xs font-inter">
                  {user.created_at ? new Date(user.created_at).toLocaleDateString('vi-VN') : 'LUMIE FERRE Member'}
                </p>
              </div>
            </div>
          ) : (
            /* Auth forms */
            <>
              {/* Tabs */}
              <div className="flex border-b border-gray-100 mb-7">
                {[['login', 'Đăng Nhập'], ['register', 'Đăng Ký']].map(([key, label]) => (
                  <button key={key} onClick={() => { setTab(key); setError(''); setSuccess(''); }}
                    className={`flex-1 py-2.5 text-xs tracking-[0.2em] uppercase font-inter transition-colors border-b-2 -mb-px ${tab === key ? 'border-black text-black' : 'border-transparent text-warm-gray hover:text-black'}`}>
                    {label}
                  </button>
                ))}
              </div>

              {error && (
                <div className="mb-4 px-4 py-3 bg-red-50 border border-red-100">
                  <p className="text-xs text-red-600 font-inter">{error}</p>
                </div>
              )}

              {tab === 'login' ? (
                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <label className={labelCls}>Email</label>
                    <input type="email" required autoComplete="email" value={loginForm.email}
                      onChange={e => setLoginForm(f => ({ ...f, email: e.target.value }))}
                      className={inputCls} placeholder="email@example.com" />
                  </div>
                  <div>
                    <label className={labelCls}>Mật khẩu</label>
                    <input type="password" required autoComplete="current-password" value={loginForm.password}
                      onChange={e => setLoginForm(f => ({ ...f, password: e.target.value }))}
                      className={inputCls} placeholder="••••••••" />
                  </div>
                  <button type="submit" disabled={loading} className="btn-dark w-full mt-2">
                    {loading ? 'ĐANG ĐĂNG NHẬP...' : 'ĐĂNG NHẬP'}
                  </button>
                  <p className="text-center text-xs text-warm-gray font-inter pt-2">
                    Chưa có tài khoản?{' '}
                    <button type="button" onClick={() => setTab('register')} className="text-black underline underline-offset-2">Đăng ký ngay</button>
                  </p>
                </form>
              ) : (
                <form onSubmit={handleRegister} className="space-y-4">
                  <div>
                    <label className={labelCls}>Họ và tên <span className="text-red-400">*</span></label>
                    <input type="text" required value={registerForm.name}
                      onChange={e => setRegisterForm(f => ({ ...f, name: e.target.value }))}
                      className={inputCls} placeholder="Nguyễn Văn A" />
                  </div>
                  <div>
                    <label className={labelCls}>Email <span className="text-red-400">*</span></label>
                    <input type="email" required autoComplete="email" value={registerForm.email}
                      onChange={e => setRegisterForm(f => ({ ...f, email: e.target.value }))}
                      className={inputCls} placeholder="email@example.com" />
                  </div>
                  <div>
                    <label className={labelCls}>Số điện thoại</label>
                    <input type="tel" value={registerForm.phone}
                      onChange={e => setRegisterForm(f => ({ ...f, phone: e.target.value }))}
                      className={inputCls} placeholder="+84 ..." />
                  </div>
                  <div>
                    <label className={labelCls}>Mật khẩu <span className="text-red-400">*</span></label>
                    <input type="password" required autoComplete="new-password" value={registerForm.password}
                      onChange={e => setRegisterForm(f => ({ ...f, password: e.target.value }))}
                      className={inputCls} placeholder="Tối thiểu 6 ký tự" />
                  </div>
                  <div>
                    <label className={labelCls}>Xác nhận mật khẩu <span className="text-red-400">*</span></label>
                    <input type="password" required autoComplete="new-password" value={registerForm.confirm}
                      onChange={e => setRegisterForm(f => ({ ...f, confirm: e.target.value }))}
                      className={inputCls} placeholder="Nhập lại mật khẩu" />
                  </div>
                  <button type="submit" disabled={loading} className="btn-dark w-full mt-2">
                    {loading ? 'ĐANG ĐĂNG KÝ...' : 'TẠO TÀI KHOẢN'}
                  </button>
                  <p className="text-center text-xs text-warm-gray font-inter pt-2">
                    Đã có tài khoản?{' '}
                    <button type="button" onClick={() => setTab('login')} className="text-black underline underline-offset-2">Đăng nhập</button>
                  </p>
                </form>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {user && (
          <div className="px-8 py-6 border-t border-gray-100">
            <button onClick={logout}
              className="w-full border border-gray-200 py-3 text-xs tracking-[0.2em] uppercase font-inter hover:border-black hover:bg-black hover:text-white transition-colors">
              ĐĂNG XUẤT
            </button>
          </div>
        )}
      </div>
    </>
  );
}
