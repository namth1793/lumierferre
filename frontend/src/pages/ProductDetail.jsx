import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useLanguage } from '../context/LanguageContext';
import ProductCard from '../components/ProductCard';

const fmt = (n) => new Intl.NumberFormat('vi-VN').format(n) + '₫';

export default function ProductDetail() {
  const { slug } = useParams();
  const { addToCart, wishlist, toggleWishlist } = useCart();
  const { t, lang } = useLanguage();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [qty, setQty] = useState(1);
  const [activeTab, setActiveTab] = useState('description');
  const [addMsg, setAddMsg] = useState('');
  const [sizeError, setSizeError] = useState(false);
  const [colorError, setColorError] = useState(false);

  useEffect(() => {
    setLoading(true); setSelectedImage(0); setSelectedSize(''); setSelectedColor(''); setQty(1);
    fetch(`/api/products/${slug}?lang=${lang}`)
      .then(r => r.json()).then(d => { setData(d); setLoading(false); }).catch(() => setLoading(false));
  }, [slug, lang]);

  const handleAddToCart = () => {
    let hasError = false;
    if (!selectedSize) { setSizeError(true); hasError = true; } else setSizeError(false);
    if (!selectedColor) { setColorError(true); hasError = true; } else setColorError(false);
    if (hasError) return;
    addToCart(data, selectedSize, selectedColor, qty);
    setAddMsg(t('detail.addedToCart'));
    setTimeout(() => setAddMsg(''), 3000);
  };

  if (loading) {
    return (
      <div className="max-w-[1440px] mx-auto px-6 py-20">
        <div className="grid md:grid-cols-2 gap-12 animate-pulse">
          <div className="space-y-3"><div className="aspect-[4/5] bg-gray-100" /><div className="flex gap-2">{[...Array(4)].map((_, i) => <div key={i} className="w-20 h-24 bg-gray-100" />)}</div></div>
          <div className="space-y-4 pt-4"><div className="h-3 bg-gray-100 w-1/4" /><div className="h-8 bg-gray-100 w-3/4" /><div className="h-6 bg-gray-100 w-1/3" /></div>
        </div>
      </div>
    );
  }

  if (!data || data.error) {
    return (
      <div className="min-h-screen flex items-center justify-center text-center px-6">
        <div>
          <p className="font-cormorant text-3xl font-light text-warm-gray mb-6">{t('detail.notFound')}</p>
          <Link to="/san-pham" className="btn-dark">{t('detail.viewAllBtn')}</Link>
        </div>
      </div>
    );
  }

  const isWished = wishlist.includes(data.id);
  const images = data.images?.length ? data.images : ['https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=700&h=900&fit=crop'];

  const TABS = [
    { key: 'description', labelKey: 'detail.descriptionTab' },
    { key: 'fabric', labelKey: 'detail.fabricTab' },
    { key: 'care', labelKey: 'detail.careTab' },
  ];

  return (
    <div>
      {/* Breadcrumb */}
      <div className="max-w-[1440px] mx-auto px-6 py-4">
        <nav className="flex items-center gap-2 text-xs text-warm-gray font-inter">
          <Link to="/" className="hover:text-black transition-colors">{t('detail.home')}</Link>
          <span>/</span>
          <Link to="/san-pham" className="hover:text-black transition-colors">{t('detail.products')}</Link>
          {data.category_name && (
            <><span>/</span>
            <Link to={`/san-pham?category=${data.category_slug}`} className="hover:text-black transition-colors">{data.category_name}</Link></>
          )}
          <span>/</span>
          <span className="text-black truncate max-w-[200px]">{data.name}</span>
        </nav>
      </div>

      <div className="max-w-[1440px] mx-auto px-6 pb-20">
        <div className="grid md:grid-cols-2 gap-10 lg:gap-16">
          {/* Images */}
          <div className="space-y-3">
            <div className="aspect-[4/5] overflow-hidden bg-gray-50 relative">
              <img src={images[selectedImage]} alt={data.name} className="w-full h-full object-cover" />
              {data.is_soldout && (
                <div className="absolute inset-0 bg-white/50 flex items-center justify-center">
                  <span className="bg-white/90 text-black text-sm tracking-[0.2em] uppercase font-inter px-6 py-3">{t('detail.outOfStock')}</span>
                </div>
              )}
            </div>
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto">
                {images.map((img, i) => (
                  <button key={i} onClick={() => setSelectedImage(i)}
                    className={`flex-shrink-0 w-20 h-24 overflow-hidden border-2 transition-colors ${selectedImage === i ? 'border-black' : 'border-transparent'}`}>
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="space-y-6 md:pt-4">
            <div className="flex items-center gap-3 flex-wrap">
              {data.category_name && (
                <Link to={`/san-pham?category=${data.category_slug}`} className="text-[10px] tracking-[0.2em] uppercase font-inter text-warm-gray hover:text-black transition-colors">
                  {data.category_name}
                </Link>
              )}
              {data.collection_name && (
                <><span className="text-warm-gray text-xs">·</span>
                <span className="text-[10px] tracking-[0.2em] uppercase font-inter text-warm-gray">{data.collection_name}</span></>
              )}
              {data.is_new === 1 && <span className="text-[9px] tracking-[0.15em] uppercase font-inter bg-black text-white px-2 py-0.5">{t('detail.new')}</span>}
              {data.is_bridal === 1 && <span className="text-[9px] tracking-[0.15em] uppercase font-inter border border-black px-2 py-0.5">{t('detail.bridal')}</span>}
            </div>

            <h1 className="font-cormorant text-4xl md:text-5xl font-light leading-tight">{data.name}</h1>

            <div className="flex items-center gap-4">
              {data.original_price && <span className="text-warm-gray text-base font-inter line-through">{fmt(data.original_price)}</span>}
              <span className="font-cormorant text-2xl font-medium">{fmt(data.price)}</span>
            </div>

            <div className="w-12 h-0.5 bg-gray-200" />

            {/* Color */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs tracking-[0.15em] uppercase font-inter">{t('detail.color')}{selectedColor ? `: ${selectedColor}` : ''}</span>
                {colorError && <span className="text-red-500 text-xs font-inter">{t('detail.selectColor')}</span>}
              </div>
              <div className="flex flex-wrap gap-2">
                {data.colors?.map(c => (
                  <button key={c} onClick={() => { setSelectedColor(c); setColorError(false); }}
                    className={`px-4 py-2 text-xs font-inter border transition-all duration-200 ${selectedColor === c ? 'bg-black text-white border-black' : 'border-gray-200 hover:border-black'}`}>
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {/* Size */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs tracking-[0.15em] uppercase font-inter">{t('detail.size')}{selectedSize ? `: ${selectedSize}` : ''}</span>
                {sizeError && <span className="text-red-500 text-xs font-inter">{t('detail.selectSize')}</span>}
              </div>
              <div className="flex flex-wrap gap-2">
                {data.sizes?.map(s => (
                  <button key={s} onClick={() => { setSelectedSize(s); setSizeError(false); }}
                    className={`w-12 h-10 text-xs font-inter border transition-all duration-200 ${selectedSize === s ? 'bg-black text-white border-black' : 'border-gray-200 hover:border-black'}`}>
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Add to cart */}
            {!data.is_soldout ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="flex items-center border border-gray-200">
                    <button onClick={() => setQty(q => Math.max(1, q - 1))} className="w-10 h-11 flex items-center justify-center hover:bg-gray-50 text-lg">−</button>
                    <span className="w-10 text-center text-sm font-inter">{qty}</span>
                    <button onClick={() => setQty(q => q + 1)} className="w-10 h-11 flex items-center justify-center hover:bg-gray-50 text-lg">+</button>
                  </div>
                  <button onClick={handleAddToCart} className="flex-1 btn-dark text-center py-3">
                    {addMsg || t('detail.addToCart')}
                  </button>
                  <button onClick={() => toggleWishlist(data.id)}
                    className={`w-11 h-11 border flex items-center justify-center transition-all ${isWished ? 'bg-black text-white border-black' : 'border-gray-200 hover:border-black'}`}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill={isWished ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.5">
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                    </svg>
                  </button>
                </div>
                <p className="text-xs text-warm-gray font-inter">{t('detail.freeShipping')}</p>
              </div>
            ) : (
              <div className="py-4 border border-gray-200 text-center">
                <p className="text-sm text-warm-gray font-inter tracking-wider uppercase">{t('detail.outOfStock')}</p>
              </div>
            )}

            {/* Tabs */}
            <div className="pt-4 border-t border-gray-100">
              <div className="flex gap-6 mb-5">
                {TABS.map(tab => (
                  <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                    className={`text-xs tracking-[0.15em] uppercase font-inter pb-2 border-b-2 transition-colors ${activeTab === tab.key ? 'border-black text-black' : 'border-transparent text-warm-gray hover:text-black'}`}>
                    {t(tab.labelKey)}
                  </button>
                ))}
              </div>
              <div className="text-sm text-gray-600 font-inter leading-relaxed">
                {activeTab === 'description' && <p>{data.description}</p>}
                {activeTab === 'fabric' && <p>{data.fabric || t('detail.noInfo')}</p>}
                {activeTab === 'care' && <p>{data.care || t('detail.noCare')}</p>}
              </div>
            </div>
          </div>
        </div>

        {/* Related */}
        {data.related?.length > 0 && (
          <div className="mt-24">
            <div className="text-center mb-12">
              <p className="text-[10px] tracking-[0.3em] uppercase font-inter text-warm-gray mb-3">{t('detail.relatedSubtitle')}</p>
              <h2 className="section-title">{t('detail.relatedTitle')}</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-x-5 gap-y-12">
              {data.related.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
