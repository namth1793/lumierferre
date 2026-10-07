import { useState, useEffect, useCallback } from 'react';
import { useAdmin } from '../../context/AdminContext';
import { useCatalog } from '../../context/CatalogContext';
import { ImageUploaderSingle } from '../../components/admin/ImageUploader';
import { EditLangBar, ViHint, useEditLang } from '../../components/admin/Bilingual';

const EMPTY = { id: null, name: '', season: '', description: '', cover_image: '', name_en: '', season_en: '', description_en: '' };

export default function AdminCollections() {
  const { authFetch } = useAdmin();
  const { refetch: refetchCatalog } = useCatalog();
  const [notice, setNotice] = useState('');
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const { isEn, k } = useEditLang();

  const fetchCollections = useCallback(() => {
    setLoading(true);
    fetch('/api/collections').then(r => r.json()).then(setCollections).catch(() => {}).finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchCollections(); }, [fetchCollections]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!editing.name) { setError('Vui lòng nhập tên bộ sưu tập (bản tiếng Việt).'); return; }
    setSaving(true); setError('');
    try {
      const url = editing.id ? `/api/admin/collections/${editing.id}` : '/api/admin/collections';
      const method = editing.id ? 'PUT' : 'POST';
      const res = await authFetch(url, { method, body: JSON.stringify(editing) });
      const data = await res.json();
      if (res.ok) {
        setEditing(null); fetchCollections(); await refetchCatalog();
        setNotice('Đã lưu và cập nhật lên website.'); setTimeout(() => setNotice(''), 3000);
      }
      else setError(data.error || 'Lỗi khi lưu bộ sưu tập');
    } catch { setError('Không thể kết nối máy chủ'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Xóa bộ sưu tập "${name}"?`)) return;
    try {
      const res = await authFetch(`/api/admin/collections/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        window.alert(data.error || 'Không thể xóa. Vui lòng thử lại.');
      }
    } catch { window.alert('Không thể kết nối máy chủ'); }
    fetchCollections();
    refetchCatalog();
  };

  const inputCls = "w-full border border-gray-200 px-4 py-3 text-sm font-inter outline-none focus:border-black transition-colors";
  const labelCls = "block text-[10px] tracking-[0.2em] uppercase font-inter text-warm-gray mb-2";

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="text-[10px] tracking-[0.3em] uppercase text-warm-gray mb-1">Quản Lý</p>
          <h1 className="font-cormorant text-3xl font-light tracking-[0.08em]">Bộ Sưu Tập</h1>
        </div>
        <button onClick={() => setEditing({ ...EMPTY })} className="btn-dark">+ Thêm Bộ Sưu Tập</button>
      </div>

      <EditLangBar />

      {notice && <p className="mb-6 text-sm font-inter text-green-600">{notice}</p>}

      {editing && (
        <form onSubmit={handleSave} className="bg-white border border-gray-100 p-6 mb-8 space-y-5 max-w-xl">
          <h2 className="text-[10px] tracking-[0.25em] uppercase text-warm-gray">{editing.id ? 'Chỉnh Sửa Bộ Sưu Tập' : 'Thêm Bộ Sưu Tập'}</h2>
          <div>
            <label className={labelCls}>Tên bộ sưu tập {!isEn && <span className="text-red-500">*</span>}</label>
            <input type="text" value={editing[k('name')] || ''} onChange={e => setEditing(c => ({ ...c, [k('name')]: e.target.value }))} className={inputCls} />
            <ViHint text={editing.name} />
          </div>
          <div>
            <label className={labelCls}>Mùa (VD: Spring Summer 2026)</label>
            <input type="text" value={editing[k('season')] || ''} onChange={e => setEditing(c => ({ ...c, [k('season')]: e.target.value }))} className={inputCls} />
            <ViHint text={editing.season} />
          </div>
          <div>
            <label className={labelCls}>Mô tả</label>
            <textarea rows={3} value={editing[k('description')] || ''} onChange={e => setEditing(c => ({ ...c, [k('description')]: e.target.value }))} className={inputCls + ' resize-none'} />
            <ViHint text={editing.description} />
          </div>
          <ImageUploaderSingle label="Ảnh bìa" value={editing.cover_image} onChange={(cover_image) => setEditing(c => ({ ...c, cover_image }))} />
          {error && <p className="text-red-500 text-sm font-inter">{error}</p>}
          <div className="flex gap-4">
            <button type="submit" disabled={saving} className="btn-dark">{saving ? 'ĐANG LƯU...' : 'LƯU'}</button>
            <button type="button" onClick={() => { setEditing(null); setError(''); }} className="btn-outline">HỦY</button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {!loading && collections.map(c => (
          <div key={c.id} className="bg-white border border-gray-100 overflow-hidden">
            <div className="aspect-[16/9] bg-gray-50">
              {c.cover_image && <img src={c.cover_image} alt={c.name} className="w-full h-full object-cover" />}
            </div>
            <div className="p-5">
              <p className="text-[10px] tracking-[0.15em] uppercase text-warm-gray font-inter mb-1">{(isEn && c.season_en) || c.season}</p>
              <h3 className="font-cormorant text-xl font-light mb-2">
                {(isEn && c.name_en) || c.name}
                {isEn && !c.name_en && <span className="ml-2 font-inter text-[9px] tracking-[0.1em] uppercase text-amber-600">chưa có EN</span>}
              </h3>
              <p className="text-xs text-warm-gray font-inter mb-4 line-clamp-2">{(isEn && c.description_en) || c.description}</p>
              <div className="flex gap-3">
                <button onClick={() => setEditing(c)} className="text-xs font-inter text-black hover:opacity-50 underline underline-offset-2">Sửa</button>
                <button onClick={() => handleDelete(c.id, c.name)} className="text-xs font-inter text-red-500 hover:opacity-50 underline underline-offset-2">Xóa</button>
              </div>
            </div>
          </div>
        ))}
      </div>
      {!loading && collections.length === 0 && (
        <div className="text-center py-16 bg-white border border-gray-100"><p className="text-sm text-warm-gray font-inter">Chưa có bộ sưu tập nào</p></div>
      )}
    </div>
  );
}
