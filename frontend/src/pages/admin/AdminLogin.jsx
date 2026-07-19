import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdmin } from '../../context/AdminContext';

export default function AdminLogin() {
  const { admin, login } = useAdmin();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (admin) navigate('/admin/dashboard');
  }, [admin, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) { login(data.token, data.username); navigate('/admin/dashboard'); }
      else setError(data.error || 'Đăng nhập thất bại');
    } catch { setError('Không thể kết nối máy chủ.'); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center px-4">
      <div className="bg-white w-full max-w-sm p-10 shadow-sm">
        <div className="text-center mb-10">
          <p className="font-cormorant text-2xl font-light tracking-[0.25em] uppercase mb-1">LUMIÈRE FERRÉ</p>
          <p className="text-[10px] tracking-[0.25em] uppercase font-inter text-warm-gray">Admin Panel</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] tracking-[0.2em] uppercase font-inter text-warm-gray mb-2">Tên đăng nhập</label>
            <input
              type="text" autoComplete="username" required
              value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
              className="w-full border border-gray-200 px-4 py-3 text-sm font-inter outline-none focus:border-black transition-colors"
              placeholder="admin"
            />
          </div>
          <div>
            <label className="block text-[10px] tracking-[0.2em] uppercase font-inter text-warm-gray mb-2">Mật khẩu</label>
            <input
              type="password" autoComplete="current-password" required
              value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              className="w-full border border-gray-200 px-4 py-3 text-sm font-inter outline-none focus:border-black transition-colors"
              placeholder="••••••••"
            />
          </div>
          {error && <p className="text-red-500 text-xs font-inter">{error}</p>}
          <button type="submit" disabled={loading} className="btn-dark w-full mt-2">
            {loading ? 'ĐANG ĐĂNG NHẬP...' : 'ĐĂNG NHẬP'}
          </button>
        </form>

        <div className="mt-8 text-center">
          <a href="/" className="text-[10px] tracking-[0.15em] uppercase font-inter text-warm-gray hover:text-black transition-colors">
            ← Về trang chủ
          </a>
        </div>
      </div>
    </div>
  );
}
