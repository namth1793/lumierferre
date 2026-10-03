import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAdmin } from '../../context/AdminContext';

const fmt = (n) => new Intl.NumberFormat('vi-VN').format(n) + '₫';

export default function AdminProducts() {
  const { authFetch } = useAdmin();
  const [products, setProducts] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [deleting, setDeleting] = useState(null);
  const LIMIT = 20;

  const fetchProducts = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ page, limit: LIMIT });
    if (search) params.set('search', search);
    authFetch(`/api/admin/products?${params}`)
      .then(r => r.json()).then(d => { setProducts(d.products || []); setTotal(d.total || 0); })
      .catch(() => {}).finally(() => setLoading(false));
  }, [page, search]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Xóa sản phẩm "${name}"?`)) return;
    setDeleting(id);
    try {
      const res = await authFetch(`/api/admin/products/${id}`, { method: 'DELETE' });
      if (!res.ok) alert((await res.json().catch(() => ({}))).error || 'Lỗi khi xóa sản phẩm');
      fetchProducts();
    } catch { alert('Lỗi khi xóa sản phẩm'); }
    finally { setDeleting(null); }
  };

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="text-[10px] tracking-[0.3em] uppercase text-warm-gray mb-1">Quản Lý</p>
          <h1 className="font-cormorant text-3xl font-light tracking-[0.08em]">Sản Phẩm</h1>
        </div>
        <Link to="/admin/products/new" className="btn-dark">+ Thêm Sản Phẩm</Link>
      </div>

      {/* Search */}
      <div className="mb-6 flex gap-3">
        <input
          type="text" placeholder="Tìm sản phẩm..." value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          className="border border-gray-200 px-4 py-2 text-sm font-inter outline-none focus:border-black transition-colors flex-1 max-w-xs"
        />
        <span className="text-xs text-warm-gray font-inter self-center">{total} sản phẩm</span>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-100 overflow-auto">
        <table className="w-full min-w-[700px]">
          <thead className="border-b border-gray-100">
            <tr className="text-left">
              {['Sản phẩm', 'Danh mục', 'Giá', 'Trạng thái', 'Thao tác'].map(h => (
                <th key={h} className="px-4 py-3 text-[10px] tracking-[0.2em] uppercase text-warm-gray font-inter font-normal">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              [...Array(5)].map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td className="px-4 py-4"><div className="h-4 bg-gray-100 w-48" /></td>
                  <td className="px-4 py-4"><div className="h-3 bg-gray-100 w-20" /></td>
                  <td className="px-4 py-4"><div className="h-3 bg-gray-100 w-24" /></td>
                  <td className="px-4 py-4"><div className="h-3 bg-gray-100 w-16" /></td>
                  <td className="px-4 py-4"><div className="h-3 bg-gray-100 w-20" /></td>
                </tr>
              ))
            ) : products.map(p => (
              <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-4">
                  <div className="flex items-center gap-3">
                    {p.images?.[0] && (
                      <img src={p.images[0]} alt={p.name} className="w-10 h-12 object-cover flex-shrink-0 bg-gray-50" />
                    )}
                    <div>
                      <p className="text-sm font-inter font-medium">{p.name}</p>
                      <p className="text-[10px] text-warm-gray font-inter">{p.slug}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4 text-xs text-warm-gray font-inter">{p.category_name || '—'}</td>
                <td className="px-4 py-4 text-sm font-inter">{fmt(p.price)}</td>
                <td className="px-4 py-4">
                  <div className="flex flex-wrap gap-1">
                    {p.is_featured ? <span className="text-[9px] bg-black text-white px-1.5 py-0.5 tracking-wide">FEATURED</span> : null}
                    {p.is_new ? <span className="text-[9px] bg-gray-800 text-white px-1.5 py-0.5 tracking-wide">NEW</span> : null}
                    {p.is_bridal ? <span className="text-[9px] border border-black px-1.5 py-0.5 tracking-wide">BRIDAL</span> : null}
                    {p.is_soldout ? <span className="text-[9px] bg-warm-gray text-white px-1.5 py-0.5 tracking-wide">SOLD OUT</span> : null}
                  </div>
                </td>
                <td className="px-4 py-4">
                  <div className="flex gap-3">
                    <Link to={`/admin/products/${p.id}/edit`} className="text-xs font-inter text-black hover:opacity-50 underline underline-offset-2">Sửa</Link>
                    <button onClick={() => handleDelete(p.id, p.name)} disabled={deleting === p.id}
                      className="text-xs font-inter text-red-500 hover:opacity-50 underline underline-offset-2 disabled:opacity-30">
                      {deleting === p.id ? '...' : 'Xóa'}
                    </button>
                    <a href={`/san-pham/${p.slug}`} target="_blank" rel="noopener noreferrer"
                      className="text-xs font-inter text-warm-gray hover:text-black transition-colors">↗</a>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {!loading && products.length === 0 && (
          <div className="text-center py-16">
            <p className="text-sm text-warm-gray font-inter">Không có sản phẩm nào</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex gap-2 mt-4 justify-end">
          {[...Array(totalPages)].map((_, i) => (
            <button key={i} onClick={() => setPage(i + 1)}
              className={`w-8 h-8 text-xs font-inter border transition-colors ${page === i + 1 ? 'bg-black text-white border-black' : 'border-gray-200 hover:border-black'}`}>
              {i + 1}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
