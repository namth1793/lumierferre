import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import { useLanguage } from '../context/LanguageContext';

export default function Products() {
  const { t } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const category = searchParams.get('category') || '';
  const collection = searchParams.get('collection') || '';
  const featured = searchParams.get('featured') || '';
  const is_new = searchParams.get('is_new') || '';
  const bridal = searchParams.get('bridal') || '';
  const search = searchParams.get('search') || '';
  const sort = searchParams.get('sort') || 'featured';
  const page = parseInt(searchParams.get('page') || '1');
  const LIMIT = 12;

  const fetchProducts = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (category) params.set('category', category);
    if (collection) params.set('collection', collection);
    if (featured) params.set('featured', featured);
    if (is_new) params.set('is_new', is_new);
    if (bridal) params.set('bridal', bridal);
    if (search) params.set('search', search);
    params.set('sort', sort); params.set('page', page); params.set('limit', LIMIT);
    fetch(`/api/products?${params}`)
      .then(r => r.json()).then(data => { setProducts(data.products || []); setTotal(data.total || 0); })
      .catch(() => {}).finally(() => setLoading(false));
  }, [category, collection, featured, is_new, bridal, search, sort, page]);

  useEffect(() => { fetch('/api/categories').then(r => r.json()).then(setCategories).catch(() => {}); }, []);
  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const setParam = (key, val) => {
    const next = new URLSearchParams(searchParams);
    if (val) next.set(key, val); else next.delete(key);
    next.delete('page'); setSearchParams(next);
  };

  const clearFilters = () => setSearchParams({ sort });
  const hasFilters = category || featured || is_new || bridal || search || collection;

  const sortOptions = [
    { value: 'featured', labelKey: 'products.featuredSort' },
    { value: 'new', labelKey: 'products.newestSort' },
    { value: 'price-asc', labelKey: 'products.priceLow' },
    { value: 'price-desc', labelKey: 'products.priceHigh' },
    { value: 'name-asc', labelKey: 'products.nameSort' },
  ];

  const pageTitle = search ? t('products.searchResults', { q: search })
    : bridal ? t('products.bridalCollection')
    : is_new ? t('products.newArrivals')
    : featured ? t('products.favorites')
    : categories.find(c => c.slug === category)?.name || t('products.allProducts');

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div className="min-h-screen">
      <div className="border-b border-gray-100 py-10 text-center px-6">
        <p className="text-[10px] tracking-[0.3em] uppercase font-inter text-warm-gray mb-2">Lumière Ferré</p>
        <h1 className="font-cormorant text-4xl md:text-5xl font-light tracking-[0.08em] uppercase">{pageTitle}</h1>
        {total > 0 && <p className="text-xs text-warm-gray font-inter mt-3 tracking-wider">{t('products.items', { n: total })}</p>}
      </div>

      <div className="max-w-[1440px] mx-auto px-6 py-8">
        <div className="flex gap-10">
          {/* Sidebar */}
          <aside className="hidden lg:block w-56 flex-shrink-0">
            <div className="sticky top-24 space-y-8">
              {hasFilters && (
                <button onClick={clearFilters} className="text-xs font-inter tracking-[0.15em] uppercase underline underline-offset-2 hover:opacity-50 transition-opacity">
                  {t('products.clearFilters')}
                </button>
              )}
              <div>
                <h3 className="text-[10px] tracking-[0.25em] uppercase font-inter text-warm-gray mb-4">{t('products.categories')}</h3>
                <ul className="space-y-2">
                  <li>
                    <button onClick={() => setParam('category', '')} className={`text-sm font-inter transition-opacity ${!category ? 'font-medium' : 'text-warm-gray hover:text-black'}`}>
                      {t('products.allCat')}
                    </button>
                  </li>
                  {categories.map(c => (
                    <li key={c.id}>
                      <button onClick={() => setParam('category', c.slug)} className={`text-sm font-inter transition-opacity ${category === c.slug ? 'font-medium' : 'text-warm-gray hover:text-black'}`}>
                        {c.name}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="text-[10px] tracking-[0.25em] uppercase font-inter text-warm-gray mb-4">{t('products.quickFilters')}</h3>
                <ul className="space-y-2">
                  {[
                    { labelKey: 'products.new', key: 'is_new', val: 'true' },
                    { labelKey: 'products.featured', key: 'featured', val: 'true' },
                    { labelKey: 'nav.bridal', key: 'bridal', val: 'true' },
                  ].map(f => (
                    <li key={f.key}>
                      <button onClick={() => setParam(f.key, searchParams.get(f.key) ? '' : f.val)}
                        className={`text-sm font-inter flex items-center gap-2 ${searchParams.get(f.key) ? 'font-medium' : 'text-warm-gray hover:text-black'}`}>
                        <span className={`w-3 h-3 border flex-shrink-0 flex items-center justify-center ${searchParams.get(f.key) ? 'bg-black border-black' : 'border-gray-300'}`}>
                          {searchParams.get(f.key) && <span className="text-white text-[8px]">✓</span>}
                        </span>
                        {t(f.labelKey)}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="text-[10px] tracking-[0.25em] uppercase font-inter text-warm-gray mb-4">{t('products.collections')}</h3>
                <ul className="space-y-2">
                  {[
                    { label: 'Rêverie SS26', slug: 'reverie-ss26' },
                    { label: 'La Pureza FW25', slug: 'la-pureza-fw25' },
                  ].map(c => (
                    <li key={c.slug}>
                      <button onClick={() => setParam('collection', collection === c.slug ? '' : c.slug)}
                        className={`text-sm font-inter transition-opacity ${collection === c.slug ? 'font-medium' : 'text-warm-gray hover:text-black'}`}>
                        {c.label}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </aside>

          {/* Main */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-8 gap-4">
              <button onClick={() => setSidebarOpen(true)} className="lg:hidden flex items-center gap-2 text-xs tracking-[0.15em] uppercase font-inter border border-black px-4 py-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="12" x2="14" y2="12"/><line x1="4" y1="18" x2="10" y2="18"/>
                </svg>
                {t('products.filtersBtn')}
              </button>
              <div className="flex items-center gap-3 ml-auto">
                <span className="text-xs text-warm-gray font-inter hidden md:block">{t('products.sortBy')}</span>
                <select value={sort} onChange={e => setParam('sort', e.target.value)} className="text-xs font-inter border border-gray-200 px-3 py-2 outline-none bg-white cursor-pointer">
                  {sortOptions.map(o => <option key={o.value} value={o.value}>{t(o.labelKey)}</option>)}
                </select>
              </div>
            </div>

            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-x-5 gap-y-12">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="animate-pulse"><div className="aspect-portrait bg-gray-100" /><div className="mt-3 space-y-2"><div className="h-2 bg-gray-100 w-1/3" /><div className="h-4 bg-gray-100 w-3/4" /><div className="h-3 bg-gray-100 w-1/4" /></div></div>
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-24">
                <p className="font-cormorant text-3xl font-light text-warm-gray mb-6">{t('products.noResults')}</p>
                <button onClick={clearFilters} className="btn-outline">{t('products.viewAll')}</button>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-x-5 gap-y-12">
                {products.map(p => <ProductCard key={p.id} product={p} />)}
              </div>
            )}

            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-16">
                <button onClick={() => setParam('page', page - 1)} disabled={page === 1} className="w-10 h-10 border border-gray-200 flex items-center justify-center text-sm hover:border-black transition-colors disabled:opacity-30">‹</button>
                {[...Array(totalPages)].map((_, i) => (
                  <button key={i} onClick={() => setParam('page', i + 1)}
                    className={`w-10 h-10 border text-sm font-inter transition-colors ${page === i + 1 ? 'bg-black text-white border-black' : 'border-gray-200 hover:border-black'}`}>
                    {i + 1}
                  </button>
                ))}
                <button onClick={() => setParam('page', page + 1)} disabled={page === totalPages} className="w-10 h-10 border border-gray-200 flex items-center justify-center text-sm hover:border-black transition-colors disabled:opacity-30">›</button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Sidebar */}
      {sidebarOpen && (
        <>
          <div className="fixed inset-0 bg-black/40 z-[200]" onClick={() => setSidebarOpen(false)} />
          <div className="fixed top-0 left-0 h-full w-80 bg-white z-[201] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-8">
              <h3 className="font-cormorant text-xl font-light tracking-[0.1em] uppercase">{t('products.filtersBtn')}</h3>
              <button onClick={() => setSidebarOpen(false)} className="text-xl hover:opacity-50">✕</button>
            </div>
            <div className="space-y-8">
              <div>
                <h4 className="text-[10px] tracking-[0.25em] uppercase font-inter text-warm-gray mb-4">{t('products.categories')}</h4>
                <ul className="space-y-3">
                  <li><button onClick={() => { setParam('category', ''); setSidebarOpen(false); }} className={`text-sm font-inter ${!category ? 'font-medium' : 'text-warm-gray'}`}>{t('products.allCat')}</button></li>
                  {categories.map(c => (
                    <li key={c.id}><button onClick={() => { setParam('category', c.slug); setSidebarOpen(false); }} className={`text-sm font-inter ${category === c.slug ? 'font-medium' : 'text-warm-gray'}`}>{c.name}</button></li>
                  ))}
                </ul>
              </div>
              {hasFilters && (
                <button onClick={() => { clearFilters(); setSidebarOpen(false); }} className="btn-outline w-full text-center">
                  {t('products.clearFilters').toUpperCase()}
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
