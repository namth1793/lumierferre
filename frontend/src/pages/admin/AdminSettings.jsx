import { useState, useEffect } from 'react';
import { useAdmin } from '../../context/AdminContext';
import { ImageUploaderSingle } from '../../components/admin/ImageUploader';

export default function AdminSettings() {
  const { authFetch } = useAdmin();
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    authFetch('/api/admin/settings/general').then(r => r.json()).then(setForm).catch(() => setForm({}));
  }, []);

  const set = (key, value) => setForm(f => ({ ...f, [key]: value }));

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true); setError(''); setSaved(false);
    try {
      const res = await authFetch('/api/admin/settings/general', { method: 'PUT', body: JSON.stringify(form) });
      if (res.ok) { setSaved(true); setTimeout(() => setSaved(false), 2500); }
      else setError('Lỗi khi lưu cài đặt');
    } catch { setError('Không thể kết nối máy chủ'); }
    finally { setSaving(false); }
  };

  if (!form) return <div className="p-8 text-center font-inter text-sm text-warm-gray">Đang tải...</div>;

  const inputCls = "w-full border border-gray-200 px-4 py-3 text-sm font-inter outline-none focus:border-black transition-colors";
  const labelCls = "block text-[10px] tracking-[0.2em] uppercase font-inter text-warm-gray mb-2";

  return (
    <div className="p-8 max-w-3xl">
      <div className="mb-8">
        <p className="text-[10px] tracking-[0.3em] uppercase text-warm-gray mb-1">Cấu Hình</p>
        <h1 className="font-cormorant text-3xl font-light tracking-[0.08em]">Cài Đặt Chung</h1>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <div className="bg-white border border-gray-100 p-6 space-y-5">
          <h2 className="text-[10px] tracking-[0.25em] uppercase text-warm-gray">Thương Hiệu</h2>
          <div>
            <label className={labelCls}>Tên shop hiển thị trên website</label>
            <input type="text" value={form.site_name || ''} onChange={e => set('site_name', e.target.value)} className={inputCls} />
          </div>
          <ImageUploaderSingle label="Logo (tùy chọn, hiển thị cạnh tên shop)" value={form.logo_url} onChange={(v) => set('logo_url', v)} />
          <div>
            <label className={labelCls}>Thông báo trên thanh đầu trang</label>
            <input type="text" value={form.announcement_text || ''} onChange={e => set('announcement_text', e.target.value)} className={inputCls} />
          </div>
        </div>

        <div className="bg-white border border-gray-100 p-6 space-y-5">
          <h2 className="text-[10px] tracking-[0.25em] uppercase text-warm-gray">Thông Tin Liên Hệ (Footer)</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Địa chỉ Hà Nội</label>
              <input type="text" value={form.footer_address_hn || ''} onChange={e => set('footer_address_hn', e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Địa chỉ TP.HCM</label>
              <input type="text" value={form.footer_address_hcm || ''} onChange={e => set('footer_address_hcm', e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Số điện thoại</label>
              <input type="text" value={form.footer_phone || ''} onChange={e => set('footer_phone', e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Email</label>
              <input type="email" value={form.footer_email || ''} onChange={e => set('footer_email', e.target.value)} className={inputCls} />
            </div>
          </div>
          <div>
            <label className={labelCls}>Giờ mở cửa</label>
            <input type="text" value={form.footer_hours || ''} onChange={e => set('footer_hours', e.target.value)} className={inputCls} />
          </div>
        </div>

        <div className="bg-white border border-gray-100 p-6 space-y-5">
          <h2 className="text-[10px] tracking-[0.25em] uppercase text-warm-gray">Mạng Xã Hội</h2>
          <div>
            <label className={labelCls}>Facebook URL</label>
            <input type="text" value={form.facebook_url || ''} onChange={e => set('facebook_url', e.target.value)} className={inputCls} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Instagram handle</label>
              <input type="text" value={form.instagram_handle || ''} onChange={e => set('instagram_handle', e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Pinterest handle</label>
              <input type="text" value={form.pinterest_handle || ''} onChange={e => set('pinterest_handle', e.target.value)} className={inputCls} />
            </div>
          </div>
        </div>

        {error && <p className="text-red-500 text-sm font-inter">{error}</p>}
        <div className="flex items-center gap-4">
          <button type="submit" disabled={saving} className="btn-dark">{saving ? 'ĐANG LƯU...' : 'LƯU CÀI ĐẶT'}</button>
          {saved && <span className="text-xs text-green-600 font-inter">Đã lưu thành công.</span>}
        </div>
      </form>
    </div>
  );
}
