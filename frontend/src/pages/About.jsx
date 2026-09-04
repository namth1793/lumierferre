import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useSiteSettings } from '../context/SiteSettingsContext';

export default function About() {
  const { t } = useLanguage();
  const { settings } = useSiteSettings();
  const about = settings.about;

  const VALUES = [
    { titleKey: 'about.craft', descKey: 'about.craftDesc', icon: '✦' },
    { titleKey: 'about.sustainability', descKey: 'about.sustainDesc', icon: '◈' },
    { titleKey: 'about.eastWest', descKey: 'about.eastWestDesc', icon: '◇' },
    { titleKey: 'about.naturalBeauty', descKey: 'about.naturalDesc', icon: '○' },
  ];

  const TEAM = about.team?.length ? about.team : [];
  const STATS = about.stats?.length ? about.stats : [];

  return (
    <div>
      {/* Hero */}
      <section className="relative h-[70vh] overflow-hidden">
        <img src={about.hero_image} alt={settings.general.site_name} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/40" />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white text-center px-6">
          <p className="text-[10px] tracking-[0.4em] uppercase font-inter mb-4 opacity-80">{about.story_label || t('about.storyLabel')}</p>
          <h1 className="font-cormorant text-6xl md:text-8xl font-light tracking-[0.08em]">{t('about.title')}</h1>
        </div>
      </section>

      {/* Brand story */}
      <section className="max-w-[900px] mx-auto px-6 py-24 text-center">
        <p className="text-[10px] tracking-[0.3em] uppercase font-inter text-warm-gray mb-8">{t('about.founded')}</p>
        <h2 className="font-cormorant text-4xl md:text-5xl font-light leading-relaxed mb-10">
          {about.heading_line1 || t('about.headingLine1')}<br /><em>{about.heading_line2 || t('about.headingLine2')}</em>
        </h2>
        <div className="w-12 h-0.5 bg-black mx-auto mb-10" />
        <div className="space-y-6 text-gray-600 font-inter text-sm leading-loose text-left md:text-center">
          <p>{about.story1 || t('about.story1')}</p>
          <p>{about.story2 || t('about.story2')}</p>
          <p>{about.story3 || t('about.story3')}</p>
        </div>
      </section>

      {/* Values */}
      <section className="bg-cream py-20 px-6">
        <div className="max-w-[1200px] mx-auto">
          <div className="text-center mb-14">
            <p className="text-[10px] tracking-[0.3em] uppercase font-inter text-warm-gray mb-3">{t('about.valuesLabel')}</p>
            <h2 className="section-title">{t('about.valuesTitle')}</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {VALUES.map(v => (
              <div key={v.titleKey} className="text-center space-y-4">
                <span className="text-3xl block">{v.icon}</span>
                <h3 className="font-cormorant text-xl font-medium tracking-[0.08em]">{t(v.titleKey)}</h3>
                <p className="text-sm text-gray-600 font-inter leading-relaxed">{t(v.descKey)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Atelier */}
      <section className="py-20 px-6 max-w-[1200px] mx-auto">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <p className="text-[10px] tracking-[0.3em] uppercase font-inter text-warm-gray">{t('about.atelierLabel')}</p>
            <h2 className="font-cormorant text-4xl font-light leading-tight">
              {about.atelier_title1 || t('about.atelierTitle1')}<br />{about.atelier_title2 || t('about.atelierTitle2')}
            </h2>
            <div className="w-10 h-0.5 bg-black" />
            <p className="text-sm text-gray-600 font-inter leading-relaxed">{about.atelier_desc1 || t('about.atelierDesc1')}</p>
            <p className="text-sm text-gray-600 font-inter leading-relaxed">{about.atelier_desc2 || t('about.atelierDesc2')}</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <img src={about.atelier_image1} alt="Atelier" className="w-full h-64 object-cover" />
            <img src={about.atelier_image2} alt="Craft" className="w-full h-64 object-cover mt-8" />
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-20 px-6 max-w-[1200px] mx-auto">
        <div className="text-center mb-14">
          <p className="text-[10px] tracking-[0.3em] uppercase font-inter text-warm-gray mb-3">{t('about.teamLabel')}</p>
          <h2 className="section-title">{t('about.teamTitle')}</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {TEAM.map((member, i) => (
            <div key={i} className="text-center group">
              <div className="aspect-[4/5] overflow-hidden mb-5 img-zoom">
                <img src={member.image} alt={member.name} className="w-full h-full object-cover" />
              </div>
              <h3 className="font-cormorant text-xl font-medium">{member.name}</h3>
              <p className="text-xs tracking-[0.15em] uppercase text-warm-gray font-inter mt-1">{member.role}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Stats */}
      <section className="py-20 bg-black text-white">
        <div className="max-w-[1200px] mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {STATS.map((s, i) => (
            <div key={i}>
              <p className="font-cormorant text-5xl font-light mb-2">{s.num}</p>
              <p className="text-[10px] tracking-[0.25em] uppercase font-inter text-white/60">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 text-center">
        <p className="text-[10px] tracking-[0.3em] uppercase font-inter text-warm-gray mb-4">{t('about.ctaLabel')}</p>
        <h2 className="font-cormorant text-4xl md:text-5xl font-light mb-8">{t('about.ctaTitle')}</h2>
        <div className="flex flex-wrap gap-4 justify-center">
          <Link to="/san-pham" className="btn-dark">{t('about.ctaBtn1')}</Link>
          <Link to="/lien-he" className="btn-outline">{t('about.ctaBtn2')}</Link>
        </div>
      </section>
    </div>
  );
}
