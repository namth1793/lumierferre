import { useState, useEffect } from 'react';
import { useAdmin } from '../../context/AdminContext';

export default function AdminContactContent() {
  const { authFetch } = useAdmin();
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    authFetch('/api/admin/settings/contact').then(r => r.json()).then(setForm).catch(() => setForm({}));
  }, []);

  const set = (key, value) => setForm(f => ({ ...f, [key]: value }));
  const setShowroom = (i, key, value) => setForm(f => {
    const showrooms = [...(f.showrooms || [])];
    showrooms[i] = { ...showrooms[i], [key]: value };
    return { ...f, showrooms };
  });
  const addShowroom = () => setForm(f => ({ ...f, showrooms: [...(f.showrooms || []), { city: '', address: '', phone: '', map: '' }] }));
  const removeShowroom = (i) => setForm(f => ({ ...f, showrooms: f.showrooms.filter((_, idx) => idx !== i) }));

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true); setError(''); setSaved(false);
    try {
      const res = await authFetch('/api/admin/settings/contact', { method: 'PUT', body: JSON.stringify(form) });
      if (res.ok) { setSaved(true); setTimeout(() => setSaved(false), 2500); }
      else setError('Lỗi khi lưu nội dung');
    } catch { setError('Không thể kết nối máy chủ'); }
    finally { setSaving(false); }
  };

  if (!form) return <div className="p-8 text-center font-inter text-sm text-warm-gray">Đang tải...</div>;

  const inputCls = "w-full border border-gray-200 px-4 py-3 text-sm font-inter outline-none focus:border-black transition-colors";
  const labelCls = "block text-[10px] tracking-[0.2em] uppercase font-inter text-warm-gray mb-2";

  return (
    <div className="p-8 max-w-3xl">
      <div className="mb-8">
        <p className="text-[10px] tracking-[0.3em] uppercase text-warm-gray mb-1">Nội Dung</p>
        <h1 className="font-cormorant text-3xl font-light tracking-[0.08em]">Liên Hệ</h1>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <div className="bg-white border border-gray-100 p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-[10px] tracking-[0.25em] uppercase text-warm-gray">Showroom</h2>
            <button type="button" onClick={addShowroom} className="text-xs font-inter underline underline-offset-2">+ Thêm showroom</button>
          </div>
          {(form.showrooms || []).map((s, i) => (
            <div key={i} className="border border-gray-100 p-4 space-y-4">
              <div className="flex justify-between items-center">
                <p className="text-xs font-inter font-medium">Showroom {i + 1}</p>
                <button type="button" onClick={() => removeShowroom(i)} className="text-[10px] text-red-500 font-inter underline underline-offset-2">Xóa</button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Thành phố</label>
                  <input type="text" value={s.city || ''} onChange={e => setShowroom(i, 'city', e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Số điện thoại</label>
                  <input type="text" value={s.phone || ''} onChange={e => setShowroom(i, 'phone', e.target.value)} className={inputCls} />
                </div>
              </div>
              <div>
                <label className={labelCls}>Địa chỉ</label>
                <input type="text" value={s.address || ''} onChange={e => setShowroom(i, 'address', e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Google Maps embed URL (tùy chọn)</label>
                <input type="text" value={s.map || ''} onChange={e => setShowroom(i, 'map', e.target.value)} className={inputCls} />
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white border border-gray-100 p-6 space-y-5">
          <h2 className="text-[10px] tracking-[0.25em] uppercase text-warm-gray">Đặt May Riêng (Bespoke)</h2>
          <div>
            <label className={labelCls}>Tiêu đề</label>
            <input type="text" value={form.bespoke_title || ''} onChange={e => set('bespoke_title', e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Mô tả</label>
            <textarea rows={3} value={form.bespoke_desc || ''} onChange={e => set('bespoke_desc', e.target.value)} className={inputCls + ' resize-none'} />
          </div>
        </div>

        {error && <p className="text-red-500 text-sm font-inter">{error}</p>}
        <div className="flex items-center gap-4">
          <button type="submit" disabled={saving} className="btn-dark">{saving ? 'ĐANG LƯU...' : 'LƯU NỘI DUNG'}</button>
          {saved && <span className="text-xs text-green-600 font-inter">Đã lưu thành công.</span>}
        </div>
      </form>
    </div>
  );
}
