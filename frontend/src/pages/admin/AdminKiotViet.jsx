import { useState, useEffect } from 'react';
import { useAdmin } from '../../context/AdminContext';

export default function AdminKiotViet() {
  const { authFetch } = useAdmin();
  const [status, setStatus] = useState(null);
  const [syncingProducts, setSyncingProducts] = useState(false);
  const [syncingCustomers, setSyncingCustomers] = useState(false);
  const [productResult, setProductResult] = useState(null);
  const [customerResult, setCustomerResult] = useState(null);
  const [error, setError] = useState('');

  const fetchStatus = () => {
    authFetch('/api/admin/kiotviet/status').then(r => r.json()).then(setStatus).catch(() => {});
  };

  useEffect(() => { fetchStatus(); }, []);

  const syncProducts = async () => {
    setSyncingProducts(true);
    setError('');
    setProductResult(null);
    try {
      const res = await authFetch('/api/admin/kiotviet/sync-products', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setProductResult(data);
    } catch (e) { setError(e.message); }
    finally { setSyncingProducts(false); }
  };

  const syncCustomers = async () => {
    setSyncingCustomers(true);
    setError('');
    setCustomerResult(null);
    try {
      const res = await authFetch('/api/admin/kiotviet/sync-customers', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setCustomerResult(data);
    } catch (e) { setError(e.message); }
    finally { setSyncingCustomers(false); }
  };

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-8">
        <p className="text-[10px] tracking-[0.3em] uppercase text-warm-gray mb-1">Admin Panel</p>
        <h1 className="font-cormorant text-3xl font-light tracking-[0.08em]">Kết Nối KiotViet</h1>
      </div>

      {/* Connection status */}
      <div className="bg-white border border-gray-100 p-6 mb-6">
        <h2 className="text-[10px] tracking-[0.25em] uppercase text-warm-gray mb-4">Trạng thái kết nối</h2>
        {!status ? (
          <p className="text-sm text-warm-gray font-inter">Đang kiểm tra...</p>
        ) : !status.configured ? (
          <div className="text-sm font-inter">
            <p className="text-red-500 mb-2">Chưa cấu hình kết nối KiotViet.</p>
            <p className="text-warm-gray">
              Thêm <code className="bg-gray-100 px-1.5 py-0.5 text-xs">KIOTVIET_CLIENT_ID</code>,{' '}
              <code className="bg-gray-100 px-1.5 py-0.5 text-xs">KIOTVIET_CLIENT_SECRET</code> và{' '}
              <code className="bg-gray-100 px-1.5 py-0.5 text-xs">KIOTVIET_RETAILER</code> vào file{' '}
              <code className="bg-gray-100 px-1.5 py-0.5 text-xs">backend/.env</code> (lấy từ KiotViet: Cài đặt {'>'} Cửa hàng {'>'} Kết nối API), sau đó khởi động lại server backend.
            </p>
          </div>
        ) : status.connected ? (
          <p className="text-sm font-inter text-green-600">✓ Đã kết nối tới KiotViet</p>
        ) : (
          <div className="text-sm font-inter">
            <p className="text-red-500 mb-1">Đã cấu hình nhưng kết nối thất bại.</p>
            <p className="text-warm-gray text-xs">{status.error}</p>
          </div>
        )}
        <button onClick={fetchStatus} className="btn-outline text-xs mt-4">Kiểm tra lại</button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-100 text-red-600 text-sm font-inter p-4 mb-6">{error}</div>
      )}

      {/* Sync products */}
      <div className="bg-white border border-gray-100 p-6 mb-6">
        <h2 className="text-[10px] tracking-[0.25em] uppercase text-warm-gray mb-2">Đồng bộ sản phẩm</h2>
        <p className="text-sm text-warm-gray font-inter mb-4">
          Kéo danh mục &amp; sản phẩm (giá, tồn kho) từ KiotViet về website. Sản phẩm đã tồn tại được cập nhật giá/tồn kho, sản phẩm mới được thêm vào.
        </p>
        <button onClick={syncProducts} disabled={!status?.connected || syncingProducts} className="btn-dark disabled:opacity-40">
          {syncingProducts ? 'ĐANG ĐỒNG BỘ...' : 'Đồng Bộ Sản Phẩm'}
        </button>
        {productResult && (
          <div className="mt-4 text-sm font-inter space-y-1 text-warm-gray">
            <p>Danh mục: {productResult.categories.total} (mới {productResult.categories.created}, cập nhật {productResult.categories.updated})</p>
            <p>Sản phẩm: {productResult.products.total} (mới {productResult.products.created}, cập nhật {productResult.products.updated}, bỏ qua {productResult.products.skipped})</p>
          </div>
        )}
      </div>

      {/* Sync customers */}
      <div className="bg-white border border-gray-100 p-6 mb-6">
        <h2 className="text-[10px] tracking-[0.25em] uppercase text-warm-gray mb-2">Đồng bộ khách hàng</h2>
        <p className="text-sm text-warm-gray font-inter mb-4">
          Kéo danh sách khách hàng từ KiotViet về để tra cứu (không ảnh hưởng tài khoản đăng nhập website).
        </p>
        <button onClick={syncCustomers} disabled={!status?.connected || syncingCustomers} className="btn-dark disabled:opacity-40">
          {syncingCustomers ? 'ĐANG ĐỒNG BỘ...' : 'Đồng Bộ Khách Hàng'}
        </button>
        {customerResult && (
          <p className="mt-4 text-sm font-inter text-warm-gray">Đã đồng bộ {customerResult.total} khách hàng.</p>
        )}
      </div>

      <div className="bg-white border border-gray-100 p-6">
        <h2 className="text-[10px] tracking-[0.25em] uppercase text-warm-gray mb-2">Đẩy đơn hàng</h2>
        <p className="text-sm text-warm-gray font-inter">
          Khi tạo đơn tại trang <a href="/admin/orders" className="underline">Đơn Hàng</a> với sản phẩm đã liên kết KiotViet (đã đồng bộ ở trên), đơn sẽ tự động được đẩy lên KiotViet.
        </p>
      </div>
    </div>
  );
}
