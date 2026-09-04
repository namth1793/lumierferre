import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import { useLanguage } from '../context/LanguageContext';
import { useSiteSettings } from '../context/SiteSettingsContext';

const DEFAULT_HERO_SLIDES = [
  {
    image: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=1920&h=1080&fit=crop&q=90',
    label: 'BỘ SƯU TẬP XUÂN HÈ 2026', title: 'Rêverie', subtitle: 'Những giấc mơ lãng mạn qua từng đường nét tinh tế',
    cta_text: 'Khám Phá Rêverie', cta_href: '/bo-suu-tap/reverie-ss26',
  },
  {
    image: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=1920&h=1080&fit=crop&q=90',
    label: 'BỘ SƯU TẬP THU ĐÔNG 2025', title: 'La Pureza', subtitle: 'Sự tinh khiết thuần túy trong từng thớ vải cao cấp',
    cta_text: 'Mua Sắm Ngay', cta_href: '/bo-suu-tap/la-pureza-fw25',
  },
];

export default function Home() {
  const { t } = useLanguage();
  const { settings } = useSiteSettings();
  const home = settings.home;
  const [products, setProducts] = useState([]);
  const [collections, setCollections] = useState([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const timerRef = useRef(null);

  const HERO_SLIDES = home.hero_slides?.length ? home.hero_slides : DEFAULT_HERO_SLIDES;

  useEffect(() => {
    fetch('/api/products?featured=true&limit=8')
      .then(r => r.json()).then(data => setProducts(data.products || [])).catch(() => {});
    fetch('/api/collections')
      .then(r => r.json()).then(data => setCollections(data || [])).catch(() => {});
  }, []);

  useEffect(() => {
    timerRef.current = setInterval(() => setCurrentSlide(s => (s + 1) % HERO_SLIDES.length), 5000);
    return () => clearInterval(timerRef.current);
  }, []);

  const goToSlide = (i) => {
    clearInterval(timerRef.current);
    setCurrentSlide(i);
    timerRef.current = setInterval(() => setCurrentSlide(s => (s + 1) % HERO_SLIDES.length), 5000);
  };

  const slide = HERO_SLIDES[currentSlide];

  return (
    <div>
      {/* ── HERO ── */}
      <section className="relative h-screen overflow-hidden">
        {HERO_SLIDES.map((s, i) => (
          <div key={i} className={`absolute inset-0 transition-opacity duration-1000 ${i === currentSlide ? 'opacity-100' : 'opacity-0'}`}>
            <img src={s.image} alt={s.title} className="w-full h-full object-cover" />
          </div>
        ))}
        <div className="absolute inset-0 bg-black/30" />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white text-center px-6">
          <p className="text-[10px] tracking-[0.4em] uppercase font-inter mb-5 opacity-90">{slide.label}</p>
          <h1 className="font-cormorant text-6xl md:text-8xl lg:text-9xl font-light tracking-[0.08em] hero-text-shadow mb-4">{slide.title}</h1>
          <p className="font-cormorant text-lg md:text-xl italic font-light opacity-90 mb-10 max-w-md">{slide.subtitle}</p>
          <Link to={slide.cta_href || '/san-pham'} className="btn-outline-white">{slide.cta_text}</Link>
        </div>
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2">
          {HERO_SLIDES.map((_, i) => (
            <button key={i} onClick={() => goToSlide(i)}
              className={`transition-all duration-300 ${i === currentSlide ? 'w-8 h-0.5 bg-white' : 'w-2 h-0.5 bg-white/50'}`}
              aria-label={`Slide ${i + 1}`} />
          ))}
        </div>
        <div className="absolute bottom-8 right-8 flex flex-col items-center gap-2 text-white">
          <span className="text-[9px] tracking-[0.25em] uppercase font-inter rotate-90 origin-center">{t('home.scroll')}</span>
        </div>
      </section>

      {/* ── FAVORITES ── */}
      <section className="py-20 px-6 max-w-[1440px] mx-auto">
        <div className="text-center mb-12">
          <p className="text-[10px] tracking-[0.3em] uppercase font-inter text-warm-gray mb-3">{t('home.customerChoice')}</p>
          <h2 className="section-title">{t('home.favoritesTitle')}</h2>
        </div>
        {products.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-5 gap-y-12">
            {products.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-portrait bg-gray-100 rounded" />
                <div className="mt-3 h-3 bg-gray-100 rounded w-1/2" />
                <div className="mt-2 h-4 bg-gray-100 rounded w-3/4" />
                <div className="mt-2 h-3 bg-gray-100 rounded w-1/3" />
              </div>
            ))}
          </div>
        )}
        <div className="text-center mt-12">
          <Link to="/san-pham?featured=true" className="btn-outline">{t('home.viewAll')}</Link>
        </div>
      </section>

      {/* ── COLLECTIONS ── */}
      <section className="py-16 px-6 max-w-[1440px] mx-auto">
        <div className="text-center mb-12">
          <p className="text-[10px] tracking-[0.3em] uppercase font-inter text-warm-gray mb-3">{t('home.worldOfFashion')}</p>
          <h2 className="section-title">{t('home.collectionsTitle')}</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {collections.map(col => (
            <Link key={col.id} to={`/bo-suu-tap/${col.slug}`} className="group relative overflow-hidden block">
              <div className="aspect-[4/5] overflow-hidden">
                <img src={col.cover_image} alt={col.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
              </div>
              <div className="absolute inset-0 bg-black/20 group-hover:bg-black/35 transition-colors duration-300" />
              <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
                <p className="text-[10px] tracking-[0.3em] uppercase font-inter opacity-80 mb-2">{col.season}</p>
                <h3 className="font-cormorant text-3xl font-light tracking-[0.1em] uppercase">{col.name}</h3>
                <span className="inline-block mt-4 text-[10px] tracking-[0.25em] uppercase font-inter border-b border-white pb-0.5 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                  {t('home.exploreNow')}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── ABOUT BRAND ── */}
      <section className="py-24 bg-cream">
        <div className="max-w-[1200px] mx-auto px-6 grid md:grid-cols-2 gap-16 items-center">
          <div>
            <img src={home.about_image} alt="Philosophy" className="w-full object-cover" />
          </div>
          <div className="space-y-6">
            <p className="text-[10px] tracking-[0.3em] uppercase font-inter text-warm-gray">{home.about_label}</p>
            <h2 className="font-cormorant text-4xl md:text-5xl font-light leading-tight">
              {home.about_title1}<br /><em>{home.about_title2}</em>
            </h2>
            <div className="w-12 h-0.5 bg-black" />
            <p className="text-sm text-gray-600 font-inter leading-relaxed">{home.about_desc1}</p>
            <p className="text-sm text-gray-600 font-inter leading-relaxed">{home.about_desc2}</p>
            <Link to="/ve-chung-toi" className="btn-outline inline-block mt-2">{t('home.aboutBtn')}</Link>
          </div>
        </div>
      </section>

      {/* ── OCCASION ICONS ── */}
      <section className="py-20 px-6 max-w-[1440px] mx-auto">
        <div className="text-center mb-12">
          <p className="text-[10px] tracking-[0.3em] uppercase font-inter text-warm-gray mb-3">{t('home.occasionFor')}</p>
          <h2 className="section-title">{t('home.occasionTitle')}</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { labelKey: 'home.bridal', img: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400&h=500&fit=crop', href: '/san-pham?bridal=true' },
            { labelKey: 'home.evening', img: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&h=500&fit=crop', href: '/san-pham?category=vay-dam' },
            { labelKey: 'home.aoDai', img: 'https://images.unsplash.com/photo-1583744946564-b52ac1c389c8?w=400&h=500&fit=crop', href: '/san-pham?category=ao-dai' },
            { labelKey: 'home.elegant', img: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=400&h=500&fit=crop', href: '/san-pham' },
          ].map(oc => (
            <Link key={oc.labelKey} to={oc.href} className="group relative overflow-hidden block">
              <div className="aspect-[3/4] overflow-hidden">
                <img src={oc.img} alt={t(oc.labelKey)} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
              </div>
              <div className="absolute inset-0 bg-black/10 group-hover:bg-black/25 transition-colors duration-300" />
              <div className="absolute bottom-5 left-0 right-0 text-center">
                <span className="font-cormorant text-xl text-white font-light tracking-[0.1em] uppercase">{t(oc.labelKey)}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── QUOTE ── */}
      <section className="py-24 bg-black text-white text-center px-6">
        <p className="text-[10px] tracking-[0.3em] uppercase font-inter text-white/50 mb-8">{home.quote_label || t('home.motto')}</p>
        <blockquote className="font-cormorant text-3xl md:text-5xl font-light italic leading-relaxed max-w-3xl mx-auto">
          {home.quote_text || t('home.quote')}
        </blockquote>
        <p className="mt-8 text-[10px] tracking-[0.25em] uppercase font-inter text-white/50">— {settings.general.site_name}</p>
      </section>
    </div>
  );
}
