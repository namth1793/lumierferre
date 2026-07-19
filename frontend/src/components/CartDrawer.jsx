import { useCart } from '../context/CartContext';
import { useLanguage } from '../context/LanguageContext';
import { Link } from 'react-router-dom';

const fmt = (n) => new Intl.NumberFormat('vi-VN').format(n) + '₫';

export default function CartDrawer() {
  const { cart, isOpen, setIsOpen, removeFromCart, updateQty, total, count } = useCart();
  const { t } = useLanguage();

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-[200]" onClick={() => setIsOpen(false)} />
      <div className="fixed top-0 right-0 h-full w-full max-w-md bg-white z-[201] slide-in-right flex flex-col">
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <h2 className="font-cormorant text-xl font-light tracking-[0.1em] uppercase">
            {t('cart.title')} {count > 0 && <span className="font-inter text-sm font-normal text-warm-gray">({count})</span>}
          </h2>
          <button onClick={() => setIsOpen(false)} className="text-xl hover:opacity-50 transition-opacity" aria-label="Close">✕</button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-6 px-6 text-center">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="text-gray-300">
                <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
                <line x1="3" y1="6" x2="21" y2="6"/>
                <path d="M16 10a4 4 0 0 1-8 0"/>
              </svg>
              <p className="font-cormorant text-xl font-light text-warm-gray">{t('cart.empty')}</p>
              <button onClick={() => setIsOpen(false)} className="btn-dark">{t('cart.continueShopping')}</button>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {cart.map((item) => (
                <div key={item.key} className="flex gap-4 p-5">
                  <Link to={`/san-pham/${item.product.slug}`} onClick={() => setIsOpen(false)} className="flex-shrink-0 w-24 h-32 bg-gray-50 overflow-hidden">
                    <img src={item.product.images?.[0] || ''} alt={item.product.name} className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link to={`/san-pham/${item.product.slug}`} onClick={() => setIsOpen(false)}
                      className="font-cormorant text-base font-medium hover:opacity-60 transition-opacity block">
                      {item.product.name}
                    </Link>
                    <p className="text-xs text-warm-gray font-inter mt-0.5">
                      {t('cart.size')}: {item.size} · {t('cart.color')}: {item.color}
                    </p>
                    <p className="text-sm font-inter mt-1">{fmt(item.product.price)}</p>
                    <div className="flex items-center gap-3 mt-3">
                      <div className="flex items-center border border-gray-200">
                        <button onClick={() => updateQty(item.key, item.qty - 1)} className="w-8 h-8 flex items-center justify-center hover:bg-gray-50 text-sm">−</button>
                        <span className="w-8 text-center text-sm font-inter">{item.qty}</span>
                        <button onClick={() => updateQty(item.key, item.qty + 1)} className="w-8 h-8 flex items-center justify-center hover:bg-gray-50 text-sm">+</button>
                      </div>
                      <button onClick={() => removeFromCart(item.key)} className="text-xs text-warm-gray hover:text-black transition-colors font-inter underline underline-offset-2">
                        {t('cart.remove')}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {cart.length > 0 && (
          <div className="border-t border-gray-100 p-6 space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-xs tracking-[0.15em] uppercase font-inter">{t('cart.total')}</span>
              <span className="font-cormorant text-xl font-medium">{fmt(total)}</span>
            </div>
            <p className="text-xs text-warm-gray font-inter">{t('cart.shippingNote')}</p>
            <button className="btn-dark w-full text-center">{t('cart.checkout')}</button>
            <button onClick={() => setIsOpen(false)} className="btn-outline w-full text-center">{t('cart.continueShopping')}</button>
          </div>
        )}
      </div>
    </>
  );
}
