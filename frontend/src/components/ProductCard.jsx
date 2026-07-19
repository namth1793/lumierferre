import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useLanguage } from '../context/LanguageContext';

const fmt = (n) => new Intl.NumberFormat('vi-VN').format(n) + '₫';

export default function ProductCard({ product }) {
  const { wishlist, toggleWishlist } = useCart();
  const { t } = useLanguage();
  const isWished = wishlist.includes(product.id);
  const img1 = product.images?.[0] || 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&h=800&fit=crop';
  const img2 = product.images?.[1] || img1;

  return (
    <div className="group relative">
      <Link to={`/san-pham/${product.slug}`} className="block relative aspect-portrait overflow-hidden bg-gray-50">
        <img src={img1} alt={product.name} className="absolute inset-0 w-full h-full object-cover transition-opacity duration-500 group-hover:opacity-0" loading="lazy" />
        <img src={img2} alt={product.name} className="absolute inset-0 w-full h-full object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100" loading="lazy" />

        <div className="absolute top-3 left-3 flex flex-col gap-1">
          {product.is_soldout ? (
            <span className="bg-warm-gray text-white text-[9px] tracking-[0.15em] uppercase px-2 py-1 font-inter">{t('card.soldOut')}</span>
          ) : product.is_new ? (
            <span className="bg-black text-white text-[9px] tracking-[0.15em] uppercase px-2 py-1 font-inter">{t('card.new')}</span>
          ) : null}
          {product.is_bridal && (
            <span className="bg-white text-black text-[9px] tracking-[0.15em] uppercase px-2 py-1 font-inter border border-black">{t('card.bridal')}</span>
          )}
        </div>

        <button
          onClick={(e) => { e.preventDefault(); toggleWishlist(product.id); }}
          className="absolute top-3 right-3 w-8 h-8 bg-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-black hover:text-white"
          aria-label="Wishlist"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill={isWished ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.5">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
        </button>

        {!product.is_soldout && (
          <div className="absolute bottom-0 left-0 right-0 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
            <Link to={`/san-pham/${product.slug}`}
              className="block w-full bg-white text-black text-center py-3 text-[10px] tracking-[0.2em] uppercase font-inter hover:bg-black hover:text-white transition-colors duration-200">
              {t('card.quickView')}
            </Link>
          </div>
        )}
      </Link>

      <div className="mt-3 space-y-1">
        {product.category_name && (
          <p className="text-[10px] tracking-[0.15em] uppercase text-warm-gray font-inter">{product.category_name}</p>
        )}
        <Link to={`/san-pham/${product.slug}`} className="block">
          <h3 className="font-cormorant text-base font-medium leading-tight hover:opacity-60 transition-opacity">{product.name}</h3>
        </Link>
        <div className="flex items-center gap-2">
          {product.original_price && (
            <span className="text-warm-gray text-xs line-through font-inter">{fmt(product.original_price)}</span>
          )}
          <span className={`text-sm font-inter ${product.is_soldout ? 'text-warm-gray' : 'text-black'}`}>
            {fmt(product.price)}
          </span>
        </div>
      </div>
    </div>
  );
}
