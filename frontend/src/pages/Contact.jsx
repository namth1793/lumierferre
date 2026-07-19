import { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';

const FB_URL = 'https://www.facebook.com/people/LUMIE-FERRE/61591943820241/';

const STORES = [
  {
    city: 'Hà Nội',
    address: '15 Tràng Tiền, Hoàn Kiếm, Hà Nội',
    phone: '+84 24 3825 6789',
    map: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3724.097148767688!2d105.8509!3d21.0245!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMjHCsDAxJzI4LjIiTiAxMDXCsDUxJzAzLjIiRQ!5e0!3m2!1svi!2svn!4v1234567890',
  },
  {
    city: 'TP. Hồ Chí Minh',
    address: '367 Nguyễn Đình Chiểu, Phường Bàn Cờ, TP. Hồ Chí Minh',
    phone: '+84 28 3829 5678',
    map: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3919.4!2d106.7009!3d10.7769!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMTDCsDQ2JzM2LjgiTiAxMDbCsDQyJzAzLjIiRQ!5e0!3m2!1svi!2svn!4v1234567890',
  },
];

export default function Contact() {
  const { t } = useLanguage();
  const SUBJECTS = [
    t('contact.subj.styling'), t('contact.subj.bespoke'), t('contact.subj.bridal'),
    t('contact.subj.shipping'), t('contact.subj.media'), t('contact.subj.other'),
  ];

  const [form, setForm] = useState({ name: '', email: '', phone: '', subject: '', message: '' });
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeStore, setActiveStore] = useState(0);

  const handleChange = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/contacts', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, subject: form.subject || SUBJECTS[0] }),
      });
      const data = await res.json();
      if (res.ok) { setStatus('success'); setForm({ name: '', email: '', phone: '', subject: '', message: '' }); }
      else setStatus(data.error || 'error');
    } catch { setStatus('Đã có lỗi xảy ra. Vui lòng thử lại.'); }
    finally { setLoading(false); }
  };

  return (
    <div>
      <div className="border-b border-gray-100 py-14 text-center px-6">
        <p className="text-[10px] tracking-[0.3em] uppercase font-inter text-warm-gray mb-3">{t('contact.weListenLabel')}</p>
        <h1 className="font-cormorant text-5xl md:text-6xl font-light tracking-[0.06em] uppercase">{t('contact.title')}</h1>
      </div>

      <div className="max-w-[1200px] mx-auto px-6 py-20">
        <div className="grid lg:grid-cols-2 gap-16">
          {/* Form */}
          <div>
            <div className="mb-10">
              <p className="text-[10px] tracking-[0.25em] uppercase font-inter text-warm-gray mb-3">{t('contact.sendLabel')}</p>
              <h2 className="font-cormorant text-3xl font-light">{t('contact.replyDesc')}</h2>
            </div>

            {status === 'success' ? (
              <div className="bg-cream p-10 text-center space-y-4">
                <p className="font-cormorant text-3xl font-light">{t('contact.thankYou')}</p>
                <p className="text-sm text-gray-600 font-inter">{t('contact.thankDesc')}</p>
                <button onClick={() => setStatus('')} className="btn-dark mt-4">{t('contact.sendAnother')}</button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <label className="block text-[10px] tracking-[0.2em] uppercase font-inter text-warm-gray mb-2">
                      {t('contact.name')} <span className="text-red-500">*</span>
                    </label>
                    <input type="text" name="name" required value={form.name} onChange={handleChange}
                      className="w-full border border-gray-200 px-4 py-3 text-sm font-inter outline-none focus:border-black transition-colors"
                      placeholder={t('contact.namePlaceholder')} />
                  </div>
                  <div>
                    <label className="block text-[10px] tracking-[0.2em] uppercase font-inter text-warm-gray mb-2">{t('contact.phone')}</label>
                    <input type="tel" name="phone" value={form.phone} onChange={handleChange}
                      className="w-full border border-gray-200 px-4 py-3 text-sm font-inter outline-none focus:border-black transition-colors"
                      placeholder={t('contact.phonePlaceholder')} />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] tracking-[0.2em] uppercase font-inter text-warm-gray mb-2">
                    {t('contact.email')} <span className="text-red-500">*</span>
                  </label>
                  <input type="email" name="email" required value={form.email} onChange={handleChange}
                    className="w-full border border-gray-200 px-4 py-3 text-sm font-inter outline-none focus:border-black transition-colors"
                    placeholder={t('contact.emailPlaceholder')} />
                </div>
                <div>
                  <label className="block text-[10px] tracking-[0.2em] uppercase font-inter text-warm-gray mb-2">{t('contact.subject')}</label>
                  <select name="subject" value={form.subject} onChange={handleChange}
                    className="w-full border border-gray-200 px-4 py-3 text-sm font-inter outline-none focus:border-black transition-colors bg-white">
                    {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] tracking-[0.2em] uppercase font-inter text-warm-gray mb-2">
                    {t('contact.message')} <span className="text-red-500">*</span>
                  </label>
                  <textarea name="message" required rows={6} value={form.message} onChange={handleChange}
                    className="w-full border border-gray-200 px-4 py-3 text-sm font-inter outline-none focus:border-black transition-colors resize-none"
                    placeholder={t('contact.messagePlaceholder')} />
                </div>
                {status && status !== 'success' && <p className="text-red-500 text-sm font-inter">{status}</p>}
                <button type="submit" disabled={loading} className="btn-dark w-full">
                  {loading ? t('contact.sending') : t('contact.send')}
                </button>
              </form>
            )}
          </div>

          {/* Store info */}
          <div className="space-y-10">
            <div>
              <p className="text-[10px] tracking-[0.25em] uppercase font-inter text-warm-gray mb-3">{t('contact.showroomsLabel')}</p>
              <h2 className="font-cormorant text-3xl font-light mb-8">{t('contact.visitTitle')}</h2>
              <div className="flex gap-1 mb-6">
                {STORES.map((s, i) => (
                  <button key={s.city} onClick={() => setActiveStore(i)}
                    className={`px-5 py-2.5 text-xs tracking-[0.15em] uppercase font-inter transition-colors ${activeStore === i ? 'bg-black text-white' : 'border border-gray-200 hover:border-black'}`}>
                    {s.city}
                  </button>
                ))}
              </div>
              <div className="space-y-5">
                {[
                  { icon: '📍', labelKey: 'contact.address', value: STORES[activeStore].address },
                  { icon: '📞', labelKey: 'contact.phoneLabel', value: STORES[activeStore].phone },
                  { icon: '🕐', labelKey: 'contact.hours', value: '9:00 — 21:00' + (t('footer.hours').includes('hàng ngày') ? ' hàng ngày' : ' daily') },
                  { icon: '✉️', labelKey: 'contact.emailLabel', value: 'hello@lumierferre.com' },
                ].map(item => (
                  <div key={item.labelKey} className="flex gap-4">
                    <span className="text-lg flex-shrink-0 mt-0.5">{item.icon}</span>
                    <div>
                      <p className="text-[10px] tracking-[0.15em] uppercase font-inter text-warm-gray mb-1">{t(item.labelKey)}</p>
                      <p className="text-sm font-inter">{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Social */}
            <div>
              <p className="text-[10px] tracking-[0.25em] uppercase font-inter text-warm-gray mb-5">{t('contact.followLabel')}</p>
              <div className="flex gap-4">
                <a href={FB_URL} target="_blank" rel="noopener noreferrer"
                  className="border border-gray-200 px-5 py-4 hover:border-black transition-colors cursor-pointer group">
                  <p className="text-xs tracking-[0.15em] uppercase font-inter mb-1 group-hover:text-black text-warm-gray">Facebook</p>
                  <p className="text-sm font-inter">@lumierferre.vn</p>
                </a>
                {[
                  { name: 'Instagram', handle: '@lumierferre' },
                  { name: 'Pinterest', handle: 'Lumière Ferré' },
                ].map(s => (
                  <div key={s.name} className="border border-gray-200 px-5 py-4 hover:border-black transition-colors cursor-pointer group">
                    <p className="text-xs tracking-[0.15em] uppercase font-inter mb-1 group-hover:text-black text-warm-gray">{s.name}</p>
                    <p className="text-sm font-inter">{s.handle}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Bespoke CTA */}
            <div className="bg-cream p-8">
              <p className="text-[10px] tracking-[0.2em] uppercase font-inter text-warm-gray mb-3">{t('contact.bespokeLabel')}</p>
              <h3 className="font-cormorant text-2xl font-light mb-3">{t('contact.bespokeTitle')}</h3>
              <p className="text-sm text-gray-600 font-inter leading-relaxed mb-5">{t('contact.bespokeDesc')}</p>
              <button className="btn-dark">{t('contact.bookBtn')}</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
