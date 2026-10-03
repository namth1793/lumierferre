import { useState, useEffect, useCallback } from 'react';
import { useAdmin } from '../../context/AdminContext';
import { ImageUploaderSingle } from '../../components/admin/ImageUploader';

const EMPTY = { id: null, name: '', description: '', image: '', sort_order: 0 };

export default function AdminCategories() {
  const { authFetch } = useAdmin();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchCategories = useCallback(() => {
    setLoading(true);
    fetch('/api/categories').then(r => r.json()).then(setCategories).catch(() => {}).finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!editing.name) { setError('Vui lòng nhập tên danh mục.'); return; }
    setSaving(true); setError('');
    try {
      const url = editing.id ? `/api/admin/categories/${editing.id}` : '/api/admin/categories';
      const method = editing.id ? 'PUT' : 'POST';
      const res = await authFetch(url, { method, body: JSON.stringify(editing) });
      const data = await res.json();
      if (res.ok) { setEditing(null); fetchCategories(); }
      else setError(data.error || 'Lỗi khi lưu danh mục');
    } catch { setError('Không thể kết nối máy chủ'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Xóa danh mục "${name}"? Sản phẩm thuộc danh mục này sẽ không còn danh mục.`)) return;
    try {
      const res = await authFetch(`/api/admin/categories/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        window.alert(data.error || 'Không thể xóa. Vui lòng thử lại.');
      }
    } catch { window.alert('Không thể kết nối máy chủ'); }
    fetchCategories();
  };

  const inputCls = "w-full border border-gray-200 px-4 py-3 text-sm font-inter outline-none focus:border-black transition-colors";
  const labelCls = "block text-[10px] tracking-[0.2em] uppercase font-inter text-warm-gray mb-2";

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="text-[10px] tracking-[0.3em] uppercase text-warm-gray mb-1">Quản Lý</p>
          <h1 className="font-cormorant text-3xl font-light tracking-[0.08em]">Danh Mục</h1>
        </div>
        <button onClick={() => setEditing({ ...EMPTY })} className="btn-dark">+ Thêm Danh Mục</button>
      </div>

      {editing && (
        <form onSubmit={handleSave} className="bg-white border border-gray-100 p-6 mb-8 space-y-5 max-w-xl">
          <h2 className="text-[10px] tracking-[0.25em] uppercase text-warm-gray">{editing.id ? 'Chỉnh Sửa Danh Mục' : 'Thêm Danh Mục'}</h2>
          <div>
            <label className={labelCls}>Tên danh mục <span className="text-red-500">*</span></label>
            <input type="text" value={editing.name} onChange={e => setEditing(c => ({ ...c, name: e.target.value }))} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Mô tả</label>
            <textarea rows={2} value={editing.description} onChange={e => setEditing(c => ({ ...c, description: e.target.value }))} className={inputCls + ' resize-none'} />
          </div>
          <ImageUploaderSingle label="Ảnh danh mục" value={editing.image} onChange={(image) => setEditing(c => ({ ...c, image }))} />
          <div>
            <label className={labelCls}>Thứ tự hiển thị</label>
            <input type="number" value={editing.sort_order} onChange={e => setEditing(c => ({ ...c, sort_order: parseInt(e.target.value) || 0 }))} className={inputCls} />
          </div>
          {error && <p className="text-red-500 text-sm font-inter">{error}</p>}
          <div className="flex gap-4">
            <button type="submit" disabled={saving} className="btn-dark">{saving ? 'ĐANG LƯU...' : 'LƯU'}</button>
            <button type="button" onClick={() => { setEditing(null); setError(''); }} className="btn-outline">HỦY</button>
          </div>
        </form>
      )}

      <div className="bg-white border border-gray-100 overflow-auto">
        <table className="w-full min-w-[600px]">
          <thead className="border-b border-gray-100">
            <tr className="text-left">
              {['Ảnh', 'Tên', 'Mô tả', 'Thao tác'].map(h => (
                <th key={h} className="px-4 py-3 text-[10px] tracking-[0.2em] uppercase text-warm-gray font-inter font-normal">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {!loading && categories.map(c => (
              <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3">
                  {c.image ? <img src={c.image} alt={c.name} className="w-10 h-10 object-cover bg-gray-50" /> : <div className="w-10 h-10 bg-gray-50" />}
                </td>
                <td className="px-4 py-3 text-sm font-inter font-medium">{c.name}</td>
                <td className="px-4 py-3 text-xs text-warm-gray font-inter max-w-xs truncate">{c.description}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-3">
                    <button onClick={() => setEditing(c)} className="text-xs font-inter text-black hover:opacity-50 underline underline-offset-2">Sửa</button>
                    <button onClick={() => handleDelete(c.id, c.name)} className="text-xs font-inter text-red-500 hover:opacity-50 underline underline-offset-2">Xóa</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && categories.length === 0 && (
          <div className="text-center py-16"><p className="text-sm text-warm-gray font-inter">Chưa có danh mục nào</p></div>
        )}
      </div>
    </div>
  );
}
