import { useState, useEffect } from 'react';
import { useAdmin } from '../../context/AdminContext';
import { useSiteSettings } from '../../context/SiteSettingsContext';
import { ImageUploaderSingle } from '../../components/admin/ImageUploader';
import { EditLangBar, ViHint, useEditLang } from '../../components/admin/Bilingual';

export default function AdminAboutContent() {
  const { authFetch } = useAdmin();
  const { refetch } = useSiteSettings();
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const { k } = useEditLang();

  useEffect(() => {
    authFetch('/api/admin/settings/about').then(r => r.json()).then(setForm).catch(() => setForm({}));
  }, []);

  const set = (key, value) => setForm(f => ({ ...f, [key]: value }));

  const setTeam = (i, key, value) => setForm(f => {
    const team = [...(f.team || [])];
    team[i] = { ...team[i], [key]: value };
    return { ...f, team };
  });
  const addTeam = () => setForm(f => ({ ...f, team: [...(f.team || []), { name: '', role: '', image: '' }] }));
  const removeTeam = (i) => setForm(f => ({ ...f, team: f.team.filter((_, idx) => idx !== i) }));

  const setStat = (i, key, value) => setForm(f => {
    const stats = [...(f.stats || [])];
    stats[i] = { ...stats[i], [key]: value };
    return { ...f, stats };
  });
  const addStat = () => setForm(f => ({ ...f, stats: [...(f.stats || []), { num: '', label: '' }] }));
  const removeStat = (i) => setForm(f => ({ ...f, stats: f.stats.filter((_, idx) => idx !== i) }));

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true); setError(''); setSaved(false);
    try {
      const res = await authFetch('/api/admin/settings/about', { method: 'PUT', body: JSON.stringify(form) });
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
        <h1 className="font-cormorant text-3xl font-light tracking-[0.08em]">Giới Thiệu</h1>
      </div>

      <EditLangBar />

      <form onSubmit={handleSave} className="space-y-6">
        <div className="bg-white border border-gray-100 p-6 space-y-5">
          <h2 className="text-[10px] tracking-[0.25em] uppercase text-warm-gray">Banner Đầu Trang</h2>
          <ImageUploaderSingle label="Ảnh nền" value={form.hero_image} onChange={(v) => set('hero_image', v)} />
        </div>

        <div className="bg-white border border-gray-100 p-6 space-y-5">
          <h2 className="text-[10px] tracking-[0.25em] uppercase text-warm-gray">Câu Chuyện Thương Hiệu</h2>
          <div>
            <label className={labelCls}>Nhãn nhỏ</label>
            <input type="text" value={form[k('story_label')] || ''} onChange={e => set(k('story_label'), e.target.value)} className={inputCls} />
            <ViHint text={form.story_label} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Tiêu đề dòng 1</label>
              <input type="text" value={form[k('heading_line1')] || ''} onChange={e => set(k('heading_line1'), e.target.value)} className={inputCls} />
            <ViHint text={form.heading_line1} />
            </div>
            <div>
              <label className={labelCls}>Tiêu đề dòng 2 (in nghiêng)</label>
              <input type="text" value={form[k('heading_line2')] || ''} onChange={e => set(k('heading_line2'), e.target.value)} className={inputCls} />
            <ViHint text={form.heading_line2} />
            </div>
          </div>
          {['story1', 'story2', 'story3'].map((key, i) => (
            <div key={key}>
              <label className={labelCls}>Đoạn {i + 1}</label>
              <textarea rows={3} value={form[k(key)] || ''} onChange={e => set(k(key), e.target.value)} className={inputCls + ' resize-none'} />
              <ViHint text={form[key]} />
            </div>
          ))}
        </div>

        <div className="bg-white border border-gray-100 p-6 space-y-5">
          <h2 className="text-[10px] tracking-[0.25em] uppercase text-warm-gray">Xưởng May (Atelier)</h2>
          <div className="grid grid-cols-2 gap-4">
            <ImageUploaderSingle label="Ảnh 1" value={form.atelier_image1} onChange={(v) => set('atelier_image1', v)} />
            <ImageUploaderSingle label="Ảnh 2" value={form.atelier_image2} onChange={(v) => set('atelier_image2', v)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Tiêu đề dòng 1</label>
              <input type="text" value={form[k('atelier_title1')] || ''} onChange={e => set(k('atelier_title1'), e.target.value)} className={inputCls} />
            <ViHint text={form.atelier_title1} />
            </div>
            <div>
              <label className={labelCls}>Tiêu đề dòng 2</label>
              <input type="text" value={form[k('atelier_title2')] || ''} onChange={e => set(k('atelier_title2'), e.target.value)} className={inputCls} />
            <ViHint text={form.atelier_title2} />
            </div>
          </div>
          <div>
            <label className={labelCls}>Đoạn mô tả 1</label>
            <textarea rows={2} value={form[k('atelier_desc1')] || ''} onChange={e => set(k('atelier_desc1'), e.target.value)} className={inputCls + ' resize-none'} />
            <ViHint text={form.atelier_desc1} />
          </div>
          <div>
            <label className={labelCls}>Đoạn mô tả 2</label>
            <textarea rows={2} value={form[k('atelier_desc2')] || ''} onChange={e => set(k('atelier_desc2'), e.target.value)} className={inputCls + ' resize-none'} />
            <ViHint text={form.atelier_desc2} />
          </div>
        </div>

        <div className="bg-white border border-gray-100 p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-[10px] tracking-[0.25em] uppercase text-warm-gray">Đội Ngũ</h2>
            <button type="button" onClick={addTeam} className="text-xs font-inter underline underline-offset-2">+ Thêm thành viên</button>
          </div>
          {(form.team || []).map((m, i) => (
            <div key={i} className="border border-gray-100 p-4 space-y-4">
              <div className="flex justify-between items-center">
                <p className="text-xs font-inter font-medium">Thành viên {i + 1}</p>
                <button type="button" onClick={() => removeTeam(i)} className="text-[10px] text-red-500 font-inter underline underline-offset-2">Xóa</button>
              </div>
              <ImageUploaderSingle label="Ảnh" value={m.image} onChange={(v) => setTeam(i, 'image', v)} />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Tên</label>
                  <input type="text" value={m.name || ''} onChange={e => setTeam(i, 'name', e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Chức vụ</label>
                  <input type="text" value={m[k('role')] || ''} onChange={e => setTeam(i, k('role'), e.target.value)} className={inputCls} />
                  <ViHint text={m.role} />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white border border-gray-100 p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-[10px] tracking-[0.25em] uppercase text-warm-gray">Số Liệu Thống Kê</h2>
            <button type="button" onClick={addStat} className="text-xs font-inter underline underline-offset-2">+ Thêm số liệu</button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {(form.stats || []).map((s, i) => (
              <div key={i} className="border border-gray-100 p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <p className="text-xs font-inter font-medium">Số liệu {i + 1}</p>
                  <button type="button" onClick={() => removeStat(i)} className="text-[10px] text-red-500 font-inter underline underline-offset-2">Xóa</button>
                </div>
                <div>
                  <label className={labelCls}>Con số</label>
                  <input type="text" value={s.num || ''} onChange={e => setStat(i, 'num', e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Nhãn</label>
                  <input type="text" value={s[k('label')] || ''} onChange={e => setStat(i, k('label'), e.target.value)} className={inputCls} />
                  <ViHint text={s.label} />
                </div>
              </div>
            ))}
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
