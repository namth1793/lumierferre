import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

const TEAM = [
  { name: 'Isabelle Ferré', roleVI: 'Nhà Sáng Lập & Giám Đốc Sáng Tạo', roleEN: 'Founder & Creative Director', img: 'https://images.unsplash.com/photo-1487222477894-8943e31ef7b2?w=500&h=600&fit=crop' },
  { name: 'Nguyễn Ánh Lumière', roleVI: 'Giám Đốc Thiết Kế', roleEN: 'Design Director', img: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=500&h=600&fit=crop' },
  { name: 'Trần Minh Laurent', roleVI: 'Giám Đốc Nghệ Thuật', roleEN: 'Art Director', img: 'https://images.unsplash.com/photo-1566479179817-c0a8b8dfafb8?w=500&h=600&fit=crop' },
];

export default function About() {
  const { t, lang } = useLanguage();

  const VALUES = [
    { titleKey: 'about.craft', descKey: 'about.craftDesc', icon: '✦' },
    { titleKey: 'about.sustainability', descKey: 'about.sustainDesc', icon: '◈' },
    { titleKey: 'about.eastWest', descKey: 'about.eastWestDesc', icon: '◇' },
    { titleKey: 'about.naturalBeauty', descKey: 'about.naturalDesc', icon: '○' },
  ];

  const STATS = [
    { num: '2018', labelKey: 'about.statsFoundedLabel' },
    { num: '50+', labelKey: 'about.statsArtisansLabel' },
    { num: '500+', labelKey: 'about.statsDesignsLabel' },
    { num: '2', labelKey: 'about.statsShowroomsLabel' },
  ];

  return (
    <div>
      {/* Hero */}
      <section className="relative h-[70vh] overflow-hidden">
        <img src="https://images.unsplash.com/photo-1475180098004-ca77a66827be?w=1920&h=1080&fit=crop&q=90" alt="Lumière Ferré Atelier" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/40" />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white text-center px-6">
          <p className="text-[10px] tracking-[0.4em] uppercase font-inter mb-4 opacity-80">{t('about.storyLabel')}</p>
          <h1 className="font-cormorant text-6xl md:text-8xl font-light tracking-[0.08em]">{t('about.title')}</h1>
        </div>
      </section>

      {/* Brand story */}
      <section className="max-w-[900px] mx-auto px-6 py-24 text-center">
        <p className="text-[10px] tracking-[0.3em] uppercase font-inter text-warm-gray mb-8">{t('about.founded')}</p>
        <h2 className="font-cormorant text-4xl md:text-5xl font-light leading-relaxed mb-10">
          {t('about.headingLine1')}<br /><em>{t('about.headingLine2')}</em>
        </h2>
        <div className="w-12 h-0.5 bg-black mx-auto mb-10" />
        <div className="space-y-6 text-gray-600 font-inter text-sm leading-loose text-left md:text-center">
          <p>{t('about.story1')}</p>
          <p>{t('about.story2')}</p>
          <p>{t('about.story3')}</p>
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
              {t('about.atelierTitle1')}<br />{t('about.atelierTitle2')}
            </h2>
            <div className="w-10 h-0.5 bg-black" />
            <p className="text-sm text-gray-600 font-inter leading-relaxed">{t('about.atelierDesc1')}</p>
            <p className="text-sm text-gray-600 font-inter leading-relaxed">{t('about.atelierDesc2')}</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <img src="https://images.unsplash.com/photo-1551163943-3f6a855d1153?w=400&h=500&fit=crop&q=85" alt="Atelier" className="w-full h-64 object-cover" />
            <img src="https://images.unsplash.com/photo-1545291730-faff8ca1d4b0?w=400&h=500&fit=crop&q=85" alt="Craft" className="w-full h-64 object-cover mt-8" />
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
          {TEAM.map(member => (
            <div key={member.name} className="text-center group">
              <div className="aspect-[4/5] overflow-hidden mb-5 img-zoom">
                <img src={member.img} alt={member.name} className="w-full h-full object-cover" />
              </div>
              <h3 className="font-cormorant text-xl font-medium">{member.name}</h3>
              <p className="text-xs tracking-[0.15em] uppercase text-warm-gray font-inter mt-1">{lang === 'en' ? member.roleEN : member.roleVI}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Stats */}
      <section className="py-20 bg-black text-white">
        <div className="max-w-[1200px] mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {STATS.map(s => (
            <div key={s.labelKey}>
              <p className="font-cormorant text-5xl font-light mb-2">{s.num}</p>
              <p className="text-[10px] tracking-[0.25em] uppercase font-inter text-white/60">{t(s.labelKey)}</p>
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
