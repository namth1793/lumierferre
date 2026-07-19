import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAdmin } from '../../context/AdminContext';

const fmt = (n) => new Intl.NumberFormat('vi-VN').format(n) + '₫';

export default function AdminDashboard() {
  const { authFetch } = useAdmin();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    authFetch('/api/admin/stats').then(r => r.json()).then(setStats).catch(() => {});
  }, []);

  const CARDS = stats ? [
    { label: 'Sản Phẩm', value: stats.totalProducts, href: '/admin/products', color: 'bg-black' },
    { label: 'Đơn Hàng', value: stats.totalOrders, href: '/admin/orders', color: 'bg-charcoal' },
    { label: 'Chờ Xử Lý', value: stats.pendingOrders, href: '/admin/orders?status=pending', color: 'bg-warm-gray' },
    { label: 'Doanh Thu', value: fmt(stats.totalRevenue), href: '/admin/orders', color: 'bg-black' },
    { label: 'Đăng Ký Email', value: stats.newSubscribers, href: '#', color: 'bg-charcoal' },
    { label: 'Tin Nhắn Mới', value: stats.newMessages, href: '#', color: 'bg-warm-gray' },
  ] : [];

  return (
    <div className="p-8">
      <div className="mb-8">
        <p className="text-[10px] tracking-[0.3em] uppercase text-warm-gray mb-1">Admin Panel</p>
        <h1 className="font-cormorant text-3xl font-light tracking-[0.08em]">Tổng Quan</h1>
      </div>

      {stats ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-10">
          {CARDS.map(c => (
            <Link key={c.label} to={c.href} className={`${c.color} text-white p-6 hover:opacity-90 transition-opacity`}>
              <p className="text-3xl font-cormorant font-light mb-1">{c.value}</p>
              <p className="text-[10px] tracking-[0.2em] uppercase text-white/70">{c.label}</p>
            </Link>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-10">
          {[...Array(6)].map((_, i) => <div key={i} className="bg-gray-100 animate-pulse h-24" />)}
        </div>
      )}

      {/* Quick actions */}
      <div className="bg-white border border-gray-100 p-6">
        <h2 className="text-[10px] tracking-[0.25em] uppercase text-warm-gray mb-5">Thao Tác Nhanh</h2>
        <div className="flex flex-wrap gap-3">
          <Link to="/admin/products/new" className="btn-dark text-sm">+ Thêm Sản Phẩm</Link>
          <Link to="/admin/orders" className="btn-outline text-sm">Xem Đơn Hàng</Link>
          <Link to="/san-pham" target="_blank" className="btn-outline text-sm">Xem Cửa Hàng ↗</Link>
        </div>
      </div>
    </div>
  );
}
