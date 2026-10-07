import { useState, useEffect } from 'react';
import { useAdmin } from '../../context/AdminContext';
import { useSiteSettings } from '../../context/SiteSettingsContext';
import { ImageUploaderSingle } from '../../components/admin/ImageUploader';
import { EditLangBar, ViHint, useEditLang } from '../../components/admin/Bilingual';

export default function AdminHomeContent() {
  const { authFetch } = useAdmin();
  const { refetch } = useSiteSettings();
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const { k } = useEditLang();

  useEffect(() => {
    authFetch('/api/admin/settings/home').then(r => r.json()).then(setForm).catch(() => setForm({}));
  }, []);

  const set = (key, value) => setForm(f => ({ ...f, [key]: value }));
  const setSlide = (i, key, value) => setForm(f => {
    const slides = [...(f.hero_slides || [])];
    slides[i] = { ...slides[i], [key]: value };
    return { ...f, hero_slides: slides };
  });
  const addSlide = () => setForm(f => ({ ...f, hero_slides: [...(f.hero_slides || []), { image: '', label: '', title: '', subtitle: '', cta_text: '', cta_href: '' }] }));
  const removeSlide = (i) => setForm(f => ({ ...f, hero_slides: f.hero_slides.filter((_, idx) => idx !== i) }));

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true); setError(''); setSaved(false);
    try {
      const res = await authFetch('/api/admin/settings/home', { method: 'PUT', body: JSON.stringify(form) });
      if (res.ok) { await refetch(); setSaved(true); setTimeout(() => setSaved(false), 2500); }
      else setError((await res.json().catch(() => ({}))).error || 'Lỗi khi lưu nội dung');
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
        <h1 className="font-cormorant text-3xl font-light tracking-[0.08em]">Trang Chủ</h1>
      </div>

      <EditLangBar />

      <form onSubmit={handleSave} className="space-y-6">
        <div className="bg-white border border-gray-100 p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-[10px] tracking-[0.25em] uppercase text-warm-gray">Hero Slides</h2>
            <button type="button" onClick={addSlide} className="text-xs font-inter underline underline-offset-2">+ Thêm slide</button>
          </div>
          {(form.hero_slides || []).map((s, i) => (
            <div key={i} className="border border-gray-100 p-4 space-y-4">
              <div className="flex justify-between items-center">
                <p className="text-xs font-inter font-medium">Slide {i + 1}</p>
                <button type="button" onClick={() => removeSlide(i)} className="text-[10px] text-red-500 font-inter underline underline-offset-2">Xóa slide</button>
              </div>
              <ImageUploaderSingle label="Ảnh nền" value={s.image} onChange={(v) => setSlide(i, 'image', v)} />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Nhãn nhỏ (phía trên tiêu đề)</label>
                  <input type="text" value={s[k('label')] || ''} onChange={e => setSlide(i, k('label'), e.target.value)} className={inputCls} />
                  <ViHint text={s.label} />
                </div>
                <div>
                  <label className={labelCls}>Tiêu đề lớn</label>
                  <input type="text" value={s[k('title')] || ''} onChange={e => setSlide(i, k('title'), e.target.value)} className={inputCls} />
                  <ViHint text={s.title} />
                </div>
              </div>
              <div>
                <label className={labelCls}>Mô tả phụ</label>
                <input type="text" value={s[k('subtitle')] || ''} onChange={e => setSlide(i, k('subtitle'), e.target.value)} className={inputCls} />
                  <ViHint text={s.subtitle} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Nút bấm (text)</label>
                  <input type="text" value={s[k('cta_text')] || ''} onChange={e => setSlide(i, k('cta_text'), e.target.value)} className={inputCls} />
                  <ViHint text={s.cta_text} />
                </div>
                <div>
                  <label className={labelCls}>Nút bấm (liên kết)</label>
                  <input type="text" value={s.cta_href || ''} onChange={e => setSlide(i, 'cta_href', e.target.value)} className={inputCls} placeholder="/bo-suu-tap/..." />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white border border-gray-100 p-6 space-y-5">
          <h2 className="text-[10px] tracking-[0.25em] uppercase text-warm-gray">Phần Triết Lý Thương Hiệu</h2>
          <ImageUploaderSingle label="Ảnh" value={form.about_image} onChange={(v) => set('about_image', v)} />
          <div>
            <label className={labelCls}>Nhãn nhỏ</label>
            <input type="text" value={form[k('about_label')] || ''} onChange={e => set(k('about_label'), e.target.value)} className={inputCls} />
            <ViHint text={form.about_label} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Tiêu đề dòng 1</label>
              <input type="text" value={form[k('about_title1')] || ''} onChange={e => set(k('about_title1'), e.target.value)} className={inputCls} />
            <ViHint text={form.about_title1} />
            </div>
            <div>
              <label className={labelCls}>Tiêu đề dòng 2 (in nghiêng)</label>
              <input type="text" value={form[k('about_title2')] || ''} onChange={e => set(k('about_title2'), e.target.value)} className={inputCls} />
            <ViHint text={form.about_title2} />
            </div>
          </div>
          <div>
            <label className={labelCls}>Đoạn mô tả 1</label>
            <textarea rows={2} value={form[k('about_desc1')] || ''} onChange={e => set(k('about_desc1'), e.target.value)} className={inputCls + ' resize-none'} />
            <ViHint text={form.about_desc1} />
          </div>
          <div>
            <label className={labelCls}>Đoạn mô tả 2</label>
            <textarea rows={2} value={form[k('about_desc2')] || ''} onChange={e => set(k('about_desc2'), e.target.value)} className={inputCls + ' resize-none'} />
            <ViHint text={form.about_desc2} />
          </div>
        </div>

        <div className="bg-white border border-gray-100 p-6 space-y-5">
          <h2 className="text-[10px] tracking-[0.25em] uppercase text-warm-gray">Câu Châm Ngôn (nền đen cuối trang)</h2>
          <div>
            <label className={labelCls}>Nhãn nhỏ</label>
            <input type="text" value={form[k('quote_label')] || ''} onChange={e => set(k('quote_label'), e.target.value)} className={inputCls} />
            <ViHint text={form.quote_label} />
          </div>
          <div>
            <label className={labelCls}>Nội dung câu châm ngôn</label>
            <textarea rows={2} value={form[k('quote_text')] || ''} onChange={e => set(k('quote_text'), e.target.value)} className={inputCls + ' resize-none'} />
            <ViHint text={form.quote_text} />
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
