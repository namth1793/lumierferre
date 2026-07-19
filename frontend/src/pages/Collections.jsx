import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import { useLanguage } from '../context/LanguageContext';

export default function Collections() {
  const { slug } = useParams();
  const { t } = useLanguage();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const COLLECTION_INFO = {
    'reverie-ss26': {
      seasonKey: 'col.ss26Season', title: 'Rêverie', subtitleKey: 'col.ss26Subtitle',
      descKey: 'col.ss26Desc',
      hero: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=1920&h=900&fit=crop&q=90',
      palette: ['#F0EBE3', '#D4C5B5', '#A8906F', '#2C2C2C'],
      paletteLabels: ['Shell', 'Sand', 'Caramel', 'Night'],
    },
    'la-pureza-fw25': {
      seasonKey: 'col.fw25Season', title: 'La Pureza', subtitleKey: 'col.fw25Subtitle',
      descKey: 'col.fw25Desc',
      hero: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=1920&h=900&fit=crop&q=90',
      palette: ['#1A1A1A', '#4A4A4A', '#8A7C70', '#F5F0EB'],
      paletteLabels: ['Noir', 'Graphite', 'Clay', 'Cream'],
    },
  };

  const info = COLLECTION_INFO[slug] || {
    seasonKey: 'col.collectionLabel', title: 'Collection', subtitleKey: 'col.ss26Subtitle',
    descKey: 'col.ss26Desc',
    hero: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=1920&h=900&fit=crop',
    palette: [], paletteLabels: [],
  };

  useEffect(() => {
    setLoading(true);
    fetch(`/api/products?collection=${slug}&limit=20`)
      .then(r => r.json()).then(d => { setProducts(d.products || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [slug]);

  return (
    <div>
      {/* Hero */}
      <section className="relative h-[80vh] overflow-hidden">
        <img src={info.hero} alt={info.title} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/35" />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white text-center px-6">
          <p className="text-[10px] tracking-[0.4em] uppercase font-inter mb-5 opacity-80">{t(info.seasonKey)}</p>
          <h1 className="font-cormorant text-7xl md:text-9xl font-light tracking-[0.06em] hero-text-shadow">{info.title}</h1>
          <p className="font-cormorant text-xl italic font-light opacity-85 mt-4 max-w-lg">{t(info.subtitleKey)}</p>
        </div>
      </section>

      {/* Story */}
      <section className="max-w-[800px] mx-auto px-6 py-20 text-center">
        <p className="font-cormorant text-xl font-light leading-loose text-gray-700 italic">{t(info.descKey)}</p>
      </section>

      {/* Color palette */}
      {info.palette.length > 0 && (
        <section className="px-6 pb-16 max-w-[1200px] mx-auto">
          <div className="text-center mb-10">
            <p className="text-[10px] tracking-[0.3em] uppercase font-inter text-warm-gray mb-2">{t('col.paletteLabel')}</p>
            <h2 className="font-cormorant text-2xl font-light tracking-[0.08em] uppercase">{t('col.paletteTitle')}</h2>
          </div>
          <div className="flex justify-center gap-6">
            {info.palette.map((color, i) => (
              <div key={i} className="text-center">
                <div className="w-16 h-16 rounded-full mx-auto mb-2 border border-gray-100" style={{ background: color }} />
                <p className="text-[10px] tracking-[0.12em] uppercase font-inter text-warm-gray">{info.paletteLabels[i]}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Products */}
      <section className="px-6 pb-24 max-w-[1440px] mx-auto">
        <div className="text-center mb-12">
          <p className="text-[10px] tracking-[0.3em] uppercase font-inter text-warm-gray mb-3">{t(info.seasonKey)}</p>
          <h2 className="section-title">{t('col.collectionDesigns')}</h2>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-5 gap-y-12">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="animate-pulse"><div className="aspect-portrait bg-gray-100" /><div className="mt-3 space-y-2"><div className="h-3 bg-gray-100 w-1/2" /><div className="h-4 bg-gray-100 w-3/4" /></div></div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-16">
            <p className="font-cormorant text-2xl font-light text-warm-gray mb-6">{t('col.updating')}</p>
            <Link to="/san-pham" className="btn-dark">{t('col.viewAll')}</Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-5 gap-y-12">
            {products.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        )}

        {products.length > 0 && (
          <div className="text-center mt-14">
            <Link to={`/san-pham?collection=${slug}`} className="btn-outline">{t('col.seeMore')}</Link>
          </div>
        )}
      </section>

      {/* Other collections */}
      <section className="bg-cream py-20 px-6">
        <div className="max-w-[1200px] mx-auto text-center">
          <p className="text-[10px] tracking-[0.3em] uppercase font-inter text-warm-gray mb-3">{t('col.otherLabel')}</p>
          <h2 className="section-title mb-12">{t('col.otherTitle')}</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {Object.entries(COLLECTION_INFO)
              .filter(([s]) => s !== slug)
              .map(([s, col]) => (
                <Link key={s} to={`/bo-suu-tap/${s}`} className="group relative overflow-hidden block">
                  <div className="aspect-[16/9] overflow-hidden">
                    <img src={col.hero} alt={col.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                  </div>
                  <div className="absolute inset-0 bg-black/25 group-hover:bg-black/40 transition-colors duration-300" />
                  <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
                    <p className="text-[10px] tracking-[0.3em] uppercase font-inter opacity-70 mb-2">{t(col.seasonKey)}</p>
                    <h3 className="font-cormorant text-4xl font-light">{col.title}</h3>
                  </div>
                </Link>
              ))}
          </div>
        </div>
      </section>
    </div>
  );
}
