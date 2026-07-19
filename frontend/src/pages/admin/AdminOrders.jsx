import { useState, useEffect, useCallback } from 'react';
import { useAdmin } from '../../context/AdminContext';

const fmt = (n) => new Intl.NumberFormat('vi-VN').format(n) + '₫';

const STATUS_LABELS = {
  pending: { label: 'Chờ xử lý', color: 'bg-yellow-100 text-yellow-800' },
  confirmed: { label: 'Đã xác nhận', color: 'bg-blue-100 text-blue-800' },
  shipping: { label: 'Đang giao', color: 'bg-purple-100 text-purple-800' },
  delivered: { label: 'Đã giao', color: 'bg-green-100 text-green-800' },
  cancelled: { label: 'Đã hủy', color: 'bg-red-100 text-red-800' },
};

const PAYMENT_STATUS_LABELS = {
  unpaid: { label: 'Chưa TT', color: 'bg-gray-100 text-gray-600' },
  paid: { label: 'Đã TT', color: 'bg-green-100 text-green-800' },
  refunded: { label: 'Hoàn tiền', color: 'bg-orange-100 text-orange-800' },
};

export default function AdminOrders() {
  const { authFetch } = useAdmin();
  const [orders, setOrders] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(null);
  const [showNewOrder, setShowNewOrder] = useState(false);
  const [saving, setSaving] = useState(false);
  const LIMIT = 20;

  const [newOrder, setNewOrder] = useState({
    customer_name: '', customer_email: '', customer_phone: '',
    customer_address: '', total: '', shipping: '0',
    payment_method: 'bank_transfer', notes: '',
  });

  const fetchOrders = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ page, limit: LIMIT });
    if (statusFilter) params.set('status', statusFilter);
    authFetch(`/api/admin/orders?${params}`)
      .then(r => r.json()).then(d => { setOrders(d.orders || []); setTotal(d.total || 0); })
      .catch(() => {}).finally(() => setLoading(false));
  }, [page, statusFilter]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const updateOrder = async (id, updates) => {
    setSaving(true);
    try {
      const order = orders.find(o => o.id === id);
      await authFetch(`/api/admin/orders/${id}`, {
        method: 'PUT', body: JSON.stringify({ ...order, ...updates }),
      });
      fetchOrders();
      if (selected?.id === id) setSelected(o => ({ ...o, ...updates }));
    } catch { alert('Lỗi khi cập nhật đơn hàng'); }
    finally { setSaving(false); }
  };

  const deleteOrder = async (id) => {
    if (!window.confirm('Xóa đơn hàng này?')) return;
    await authFetch(`/api/admin/orders/${id}`, { method: 'DELETE' });
    setSelected(null);
    fetchOrders();
  };

  const handleCreateOrder = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await authFetch('/api/admin/orders', {
        method: 'POST',
        body: JSON.stringify({ ...newOrder, total: parseFloat(newOrder.total), shipping: parseFloat(newOrder.shipping) }),
      });
      if (res.ok) {
        setShowNewOrder(false);
        setNewOrder({ customer_name: '', customer_email: '', customer_phone: '', customer_address: '', total: '', shipping: '0', payment_method: 'bank_transfer', notes: '' });
        fetchOrders();
      }
    } catch { alert('Lỗi khi tạo đơn hàng'); }
    finally { setSaving(false); }
  };

  const totalPages = Math.ceil(total / LIMIT);
  const inputCls = "w-full border border-gray-200 px-3 py-2.5 text-sm font-inter outline-none focus:border-black transition-colors";
  const labelCls = "block text-[10px] tracking-[0.15em] uppercase font-inter text-warm-gray mb-1.5";

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="text-[10px] tracking-[0.3em] uppercase text-warm-gray mb-1">Quản Lý</p>
          <h1 className="font-cormorant text-3xl font-light tracking-[0.08em]">Đơn Hàng ({total})</h1>
        </div>
        <button onClick={() => setShowNewOrder(true)} className="btn-dark">+ Tạo Đơn Hàng</button>
      </div>

      {/* Status filter */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {[['', 'Tất cả'], ...Object.entries(STATUS_LABELS).map(([k, v]) => [k, v.label])].map(([val, label]) => (
          <button key={val} onClick={() => { setStatusFilter(val); setPage(1); }}
            className={`px-4 py-1.5 text-xs tracking-[0.1em] uppercase font-inter transition-colors border ${statusFilter === val ? 'bg-black text-white border-black' : 'border-gray-200 hover:border-black'}`}>
            {label}
          </button>
        ))}
      </div>

      <div className="flex gap-6">
        {/* Order list */}
        <div className="flex-1 min-w-0">
          <div className="bg-white border border-gray-100 overflow-auto">
            <table className="w-full min-w-[600px]">
              <thead className="border-b border-gray-100">
                <tr className="text-left">
                  {['Mã đơn', 'Khách hàng', 'Tổng tiền', 'Trạng thái', 'Thanh toán', 'Ngày tạo'].map(h => (
                    <th key={h} className="px-4 py-3 text-[10px] tracking-[0.15em] uppercase text-warm-gray font-inter font-normal">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading ? (
                  [...Array(5)].map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      {[...Array(6)].map((_, j) => <td key={j} className="px-4 py-4"><div className="h-3 bg-gray-100 rounded" /></td>)}
                    </tr>
                  ))
                ) : orders.map(o => (
                  <tr key={o.id} onClick={() => setSelected(o)}
                    className={`cursor-pointer hover:bg-gray-50 transition-colors ${selected?.id === o.id ? 'bg-gray-50' : ''}`}>
                    <td className="px-4 py-3 text-xs font-inter font-medium text-black">{o.order_number}</td>
                    <td className="px-4 py-3">
                      <p className="text-sm font-inter">{o.customer_name}</p>
                      <p className="text-[10px] text-warm-gray">{o.customer_phone}</p>
                    </td>
                    <td className="px-4 py-3 text-sm font-inter">{fmt(o.total)}</td>
                    <td className="px-4 py-3">
                      <span className={`text-[9px] tracking-[0.1em] px-2 py-1 rounded-full ${STATUS_LABELS[o.status]?.color || 'bg-gray-100'}`}>
                        {STATUS_LABELS[o.status]?.label || o.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-[9px] tracking-[0.1em] px-2 py-1 rounded-full ${PAYMENT_STATUS_LABELS[o.payment_status]?.color || 'bg-gray-100'}`}>
                        {PAYMENT_STATUS_LABELS[o.payment_status]?.label || o.payment_status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-warm-gray font-inter">
                      {new Date(o.created_at).toLocaleDateString('vi-VN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!loading && orders.length === 0 && (
              <div className="text-center py-16"><p className="text-sm text-warm-gray font-inter">Chưa có đơn hàng nào</p></div>
            )}
          </div>
          {totalPages > 1 && (
            <div className="flex gap-2 mt-3 justify-end">
              {[...Array(totalPages)].map((_, i) => (
                <button key={i} onClick={() => setPage(i + 1)}
                  className={`w-8 h-8 text-xs font-inter border transition-colors ${page === i + 1 ? 'bg-black text-white border-black' : 'border-gray-200 hover:border-black'}`}>
                  {i + 1}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Order detail panel */}
        {selected && (
          <div className="w-72 flex-shrink-0 bg-white border border-gray-100 p-5 h-fit sticky top-8">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-cormorant text-lg font-light">{selected.order_number}</h3>
              <button onClick={() => setSelected(null)} className="text-warm-gray hover:text-black text-lg">✕</button>
            </div>
            <div className="space-y-3 mb-5 text-sm font-inter">
              <div><p className="text-[10px] uppercase tracking-[0.15em] text-warm-gray">Khách hàng</p><p className="font-medium">{selected.customer_name}</p></div>
              {selected.customer_phone && <div><p className="text-[10px] uppercase tracking-[0.15em] text-warm-gray">Điện thoại</p><p>{selected.customer_phone}</p></div>}
              {selected.customer_email && <div><p className="text-[10px] uppercase tracking-[0.15em] text-warm-gray">Email</p><p>{selected.customer_email}</p></div>}
              {selected.customer_address && <div><p className="text-[10px] uppercase tracking-[0.15em] text-warm-gray">Địa chỉ</p><p>{selected.customer_address}</p></div>}
              <div><p className="text-[10px] uppercase tracking-[0.15em] text-warm-gray">Tổng tiền</p><p className="font-medium text-lg">{fmt(selected.total)}</p></div>
            </div>

            <div className="space-y-3 border-t border-gray-100 pt-4">
              <div>
                <label className={labelCls}>Trạng thái đơn</label>
                <select value={selected.status} onChange={e => { setSelected(o => ({ ...o, status: e.target.value })); updateOrder(selected.id, { status: e.target.value }); }}
                  className={inputCls + ' bg-white cursor-pointer'}>
                  {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Thanh toán</label>
                <select value={selected.payment_status} onChange={e => { setSelected(o => ({ ...o, payment_status: e.target.value })); updateOrder(selected.id, { payment_status: e.target.value }); }}
                  className={inputCls + ' bg-white cursor-pointer'}>
                  {Object.entries(PAYMENT_STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
              </div>
              {selected.notes !== undefined && (
                <div>
                  <label className={labelCls}>Ghi chú</label>
                  <textarea rows={3} value={selected.notes || ''} onChange={e => setSelected(o => ({ ...o, notes: e.target.value }))}
                    onBlur={() => updateOrder(selected.id, { notes: selected.notes })}
                    className={inputCls + ' resize-none'} placeholder="Ghi chú..." />
                </div>
              )}
            </div>

            <button onClick={() => deleteOrder(selected.id)} className="mt-4 w-full border border-red-200 text-red-500 text-xs tracking-[0.1em] uppercase font-inter py-2 hover:bg-red-50 transition-colors">
              Xóa đơn hàng
            </button>
          </div>
        )}
      </div>

      {/* New Order Modal */}
      {showNewOrder && (
        <>
          <div className="fixed inset-0 bg-black/50 z-[300]" onClick={() => setShowNewOrder(false)} />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white w-full max-w-lg z-[301] p-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-cormorant text-2xl font-light">Tạo Đơn Hàng Mới</h2>
              <button onClick={() => setShowNewOrder(false)} className="text-xl hover:opacity-50">✕</button>
            </div>
            <form onSubmit={handleCreateOrder} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Tên khách hàng *</label>
                  <input required type="text" value={newOrder.customer_name}
                    onChange={e => setNewOrder(f => ({ ...f, customer_name: e.target.value }))}
                    className={inputCls} placeholder="Nguyễn Văn A" />
                </div>
                <div>
                  <label className={labelCls}>Số điện thoại</label>
                  <input type="tel" value={newOrder.customer_phone}
                    onChange={e => setNewOrder(f => ({ ...f, customer_phone: e.target.value }))}
                    className={inputCls} placeholder="+84..." />
                </div>
              </div>
              <div>
                <label className={labelCls}>Email</label>
                <input type="email" value={newOrder.customer_email}
                  onChange={e => setNewOrder(f => ({ ...f, customer_email: e.target.value }))}
                  className={inputCls} placeholder="email@example.com" />
              </div>
              <div>
                <label className={labelCls}>Địa chỉ giao hàng</label>
                <input type="text" value={newOrder.customer_address}
                  onChange={e => setNewOrder(f => ({ ...f, customer_address: e.target.value }))}
                  className={inputCls} placeholder="Số nhà, đường, phường, quận, thành phố" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Tổng tiền (₫) *</label>
                  <input required type="number" value={newOrder.total}
                    onChange={e => setNewOrder(f => ({ ...f, total: e.target.value }))}
                    className={inputCls} placeholder="12000000" />
                </div>
                <div>
                  <label className={labelCls}>Phí vận chuyển (₫)</label>
                  <input type="number" value={newOrder.shipping}
                    onChange={e => setNewOrder(f => ({ ...f, shipping: e.target.value }))}
                    className={inputCls} placeholder="0" />
                </div>
              </div>
              <div>
                <label className={labelCls}>Hình thức thanh toán</label>
                <select value={newOrder.payment_method}
                  onChange={e => setNewOrder(f => ({ ...f, payment_method: e.target.value }))}
                  className={inputCls + ' bg-white cursor-pointer'}>
                  <option value="bank_transfer">Chuyển khoản ngân hàng</option>
                  <option value="cash">Tiền mặt</option>
                  <option value="momo">MoMo</option>
                  <option value="vnpay">VNPay</option>
                  <option value="cod">COD</option>
                </select>
              </div>
              <div>
                <label className={labelCls}>Ghi chú</label>
                <textarea rows={3} value={newOrder.notes}
                  onChange={e => setNewOrder(f => ({ ...f, notes: e.target.value }))}
                  className={inputCls + ' resize-none'} placeholder="Ghi chú..." />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={saving} className="btn-dark flex-1">
                  {saving ? 'ĐANG TẠO...' : 'TẠO ĐƠN HÀNG'}
                </button>
                <button type="button" onClick={() => setShowNewOrder(false)} className="btn-outline">HỦY</button>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
