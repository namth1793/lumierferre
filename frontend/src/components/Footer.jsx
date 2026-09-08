import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useSiteSettings } from '../context/SiteSettingsContext';

export default function Footer() {
  const { t } = useLanguage();
  const { settings } = useSiteSettings();
  const g = settings.general;
  const FB_URL = g.facebook_url || 'https://www.facebook.com/';
  const [email, setEmail] = useState('');
  const [subStatus, setSubStatus] = useState('');

  const handleSubscribe = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok) { setSubStatus('success'); setEmail(''); }
      else setSubStatus(data.error || 'error');
    } catch { setSubStatus('error'); }
  };

  return (
    <footer className="bg-black text-white pt-16 pb-8">
      <div className="max-w-[1440px] mx-auto px-6">
        {/* Newsletter */}
        <div className="text-center mb-16 pb-16 border-b border-white/10">
          <p className="text-[10px] tracking-[0.25em] uppercase font-inter text-white/60 mb-3">{t('footer.newsletter.label')}</p>
          <h3 className="font-cormorant text-3xl md:text-4xl font-light tracking-[0.08em] uppercase mb-4">{t('footer.newsletter.title')}</h3>
          <p className="text-sm text-white/60 font-inter mb-8 max-w-md mx-auto">{t('footer.newsletter.desc')}</p>
          {subStatus === 'success' ? (
            <p className="font-cormorant text-lg italic text-white/80">{t('footer.newsletter.thanks')}</p>
          ) : (
            <form onSubmit={handleSubscribe} className="flex max-w-md mx-auto">
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder={t('footer.newsletter.placeholder')} required
                className="flex-1 bg-transparent border border-white/30 px-5 py-3 text-sm text-white placeholder-white/40 font-inter outline-none focus:border-white transition-colors"
              />
              <button type="submit" className="bg-white text-black px-8 py-3 text-xs tracking-[0.2em] uppercase font-inter hover:bg-white/90 transition-colors flex-shrink-0">
                {t('footer.newsletter.btn')}
              </button>
            </form>
          )}
          {subStatus && subStatus !== 'success' && (
            <p className="text-red-400 text-xs font-inter mt-2">{subStatus}</p>
          )}
        </div>

        {/* Links */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-16">
          <div>
            <h4 className="text-[10px] tracking-[0.25em] uppercase font-inter text-white/60 mb-5">{t('footer.support')}</h4>
            <ul className="space-y-3">
              {[
                [t('footer.contact'), '/lien-he'],
                [t('footer.tracking'), '/lien-he'],
                [t('footer.payment'), '/lien-he'],
                [t('footer.shipping'), '/lien-he'],
                [t('footer.returns'), '/lien-he'],
                [t('footer.privacy'), '/lien-he'],
              ].map(([label, href]) => (
                <li key={label}>
                  <Link to={href} className="text-xs text-white/70 font-inter hover:text-white transition-colors tracking-wide">{label}</Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-[10px] tracking-[0.25em] uppercase font-inter text-white/60 mb-5">{t('footer.about')}</h4>
            <ul className="space-y-3">
              {[
                [t('footer.story'), '/ve-chung-toi'],
                [t('footer.stores'), '/lien-he'],
                [t('footer.careers'), '/lien-he'],
                [t('footer.collections'), '/san-pham'],
              ].map(([label, href]) => (
                <li key={label}>
                  <Link to={href} className="text-xs text-white/70 font-inter hover:text-white transition-colors tracking-wide">{label}</Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-[10px] tracking-[0.25em] uppercase font-inter text-white/60 mb-5">{t('footer.categories')}</h4>
            <ul className="space-y-3">
              {[
                ['Váy đầm', '/san-pham?category=vay-dam'],
                ['Áo dài', '/san-pham?category=ao-dai'],
                ['Tops', '/san-pham?category=tops'],
                ['Outerwear', '/san-pham?category=outerwear'],
                ['Jumpsuits', '/san-pham?category=jumpsuits'],
                ['Bridal', '/san-pham?bridal=true'],
              ].map(([label, href]) => (
                <li key={label}>
                  <Link to={href} className="text-xs text-white/70 font-inter hover:text-white transition-colors tracking-wide">{label}</Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-[10px] tracking-[0.25em] uppercase font-inter text-white/60 mb-5">{t('footer.contactTitle')}</h4>
            <address className="not-italic space-y-3 text-xs text-white/70 font-inter leading-relaxed">
              <p>{g.footer_address_hn}</p>
              <p>{g.footer_address_hcm}</p>
              <p>{g.footer_phone}</p>
              <p>{g.footer_email}</p>
              <p>{g.footer_hours}</p>
            </address>
            <div className="flex gap-4 mt-5">
              <a href={FB_URL} target="_blank" rel="noopener noreferrer" className="text-[10px] tracking-[0.1em] uppercase font-inter text-white/50 hover:text-white transition-colors">F</a>
              <a href="#" className="text-[10px] tracking-[0.1em] uppercase font-inter text-white/50 hover:text-white transition-colors">I</a>
              <a href="#" className="text-[10px] tracking-[0.1em] uppercase font-inter text-white/50 hover:text-white transition-colors">P</a>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="font-cormorant text-2xl font-light tracking-[0.2em] uppercase">{g.site_name}</p>
          <p className="text-[10px] text-white/40 font-inter tracking-wider">
            {t('footer.copyright', { year: new Date().getFullYear() })}
          </p>
          <div className="flex gap-3 items-center">
            {['VISA', 'MC', 'MOMO', 'VNPAY'].map(p => (
              <span key={p} className="border border-white/20 text-white/50 text-[9px] font-inter px-2 py-1 tracking-wider">{p}</span>
            ))}
            <Link to="/admin" className="text-[9px] text-white/20 font-inter hover:text-white/50 transition-colors tracking-wider ml-2">Admin</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
