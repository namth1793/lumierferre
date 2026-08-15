import { useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAdmin } from '../../context/AdminContext';

const NAV = [
  { label: 'Tổng Quan', href: '/admin/dashboard', icon: '◈' },
  { label: 'Sản Phẩm', href: '/admin/products', icon: '✦' },
  { label: 'Đơn Hàng', href: '/admin/orders', icon: '◇' },
  { label: 'KiotViet', href: '/admin/kiotviet', icon: '⇄' },
];

export default function AdminLayout({ children }) {
  const { admin, logout } = useAdmin();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!admin) navigate('/admin');
  }, [admin, navigate]);

  if (!admin) return null;

  return (
    <div className="min-h-screen flex bg-gray-50 font-inter">
      {/* Sidebar */}
      <aside className="w-56 bg-black text-white flex flex-col flex-shrink-0">
        <div className="px-6 py-6 border-b border-white/10">
          <p className="font-cormorant text-lg font-light tracking-[0.15em] uppercase">LUMIÈRE FERRÉ</p>
          <p className="text-[9px] tracking-[0.2em] uppercase text-white/50 mt-0.5">Admin Panel</p>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-1">
          {NAV.map(item => (
            <Link
              key={item.href}
              to={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 text-xs tracking-[0.15em] uppercase transition-colors rounded ${
                location.pathname === item.href ? 'bg-white/10 text-white' : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="px-4 py-4 border-t border-white/10">
          <p className="text-[10px] text-white/40 mb-3 px-3">{admin.username}</p>
          <Link to="/" className="block px-3 py-2 text-xs tracking-[0.1em] uppercase text-white/50 hover:text-white transition-colors">← Website</Link>
          <button onClick={() => { logout(); navigate('/admin'); }}
            className="block w-full text-left px-3 py-2 text-xs tracking-[0.1em] uppercase text-white/50 hover:text-red-400 transition-colors">
            Đăng xuất
          </button>
        </div>
      </aside>

      {/* Content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
