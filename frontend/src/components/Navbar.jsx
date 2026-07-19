import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useLanguage } from '../context/LanguageContext';
import { useUser } from '../context/UserContext';

export default function Navbar() {
  const { count, setIsOpen } = useCart();
  const { lang, t, toggleLanguage } = useLanguage();
  const { user, openAuthDrawer, logout } = useUser();
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const userMenuRef = useRef(null);

  const NAV_ITEMS = [
    {
      labelKey: 'nav.newArrivals',
      children: [
        { labelKey: 'nav.ss26', href: '/bo-suu-tap/reverie-ss26' },
        { labelKey: 'nav.fw25', href: '/bo-suu-tap/la-pureza-fw25' },
        { labelKey: 'nav.viewAllNew', href: '/san-pham?is_new=true' },
      ],
    },
    { labelKey: 'nav.favorites', href: '/san-pham?featured=true' },
    { labelKey: 'nav.bridal', href: '/san-pham?bridal=true' },
    { labelKey: 'nav.elegant', href: '/san-pham?category=ao-dai' },
    {
      labelKey: 'nav.categories',
      children: [
        { labelKey: 'nav.dresses', href: '/san-pham?category=vay-dam' },
        { labelKey: 'nav.tops', href: '/san-pham?category=tops' },
        { labelKey: 'nav.bottom', href: '/san-pham?category=bottom' },
        { labelKey: 'nav.outerwear', href: '/san-pham?category=outerwear' },
        { labelKey: 'nav.cape', href: '/san-pham?category=cape' },
        { labelKey: 'nav.jumpsuits', href: '/san-pham?category=jumpsuits' },
        { labelKey: 'nav.aoDai', href: '/san-pham?category=ao-dai' },
        { labelKey: 'nav.accessories', href: '/san-pham?category=phu-kien' },
      ],
    },
    {
      labelKey: 'nav.collections',
      children: [
        { labelKey: 'nav.reverie', href: '/bo-suu-tap/reverie-ss26' },
        { labelKey: 'nav.pureza', href: '/bo-suu-tap/la-pureza-fw25' },
      ],
    },
    { labelKey: 'nav.occasion', href: '/san-pham?featured=true' },
  ];

  useEffect(() => { setMobileOpen(false); setActiveDropdown(null); setUserMenuOpen(false); }, [location]);

  useEffect(() => {
    const handleClick = (e) => { if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setUserMenuOpen(false); };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/san-pham?search=${encodeURIComponent(searchQuery)}`);
      setSearchOpen(false);
      setSearchQuery('');
    }
  };

  const renderDropdown = (item, align = 'left') => (
    item.children && activeDropdown === item.labelKey && (
      <div className={`dropdown-enter absolute top-full ${align === 'right' ? 'right-0' : 'left-0'} bg-white border border-gray-100 shadow-lg py-4 px-5 min-w-[200px] z-50`}>
        {item.children.map(child => (
          <Link
            key={child.labelKey}
            to={child.href}
            className="block py-1.5 text-xs tracking-[0.1em] uppercase font-inter hover:opacity-50 transition-opacity whitespace-nowrap"
          >
            {t(child.labelKey)}
          </Link>
        ))}
      </div>
    )
  );

  return (
    <>
      <div className="bg-black text-white text-center py-2 text-xs tracking-[0.15em] font-inter">
        {t('announcement')}
      </div>

      <header
        className={`sticky top-0 z-50 bg-white transition-shadow duration-300 ${scrolled ? 'shadow-sm' : ''}`}
        onMouseLeave={() => setActiveDropdown(null)}
      >
        <nav className="max-w-[1440px] mx-auto px-6 flex items-center h-16">
          {/* Left nav */}
          <div className="hidden lg:flex items-center gap-6 flex-1">
            {NAV_ITEMS.slice(0, 4).map((item) => (
              <div key={item.labelKey} className="relative" onMouseEnter={() => setActiveDropdown(item.labelKey)}>
                {item.href ? (
                  <Link to={item.href} className="nav-link">{t(item.labelKey)}</Link>
                ) : (
                  <button className="nav-link">{t(item.labelKey)}</button>
                )}
                {renderDropdown(item, 'left')}
              </div>
            ))}
          </div>

          {/* Logo */}
          <Link to="/" className="font-cormorant text-xl md:text-2xl font-light tracking-[0.25em] uppercase text-black flex-shrink-0 mx-auto lg:mx-0 lg:absolute lg:left-1/2 lg:-translate-x-1/2">
            LUMIÈRE FERRÉ
          </Link>

          {/* Right nav */}
          <div className="hidden lg:flex items-center gap-6 flex-1 justify-end">
            {NAV_ITEMS.slice(4).map((item) => (
              <div key={item.labelKey} className="relative" onMouseEnter={() => setActiveDropdown(item.labelKey)}>
                {item.href ? (
                  <Link to={item.href} className="nav-link">{t(item.labelKey)}</Link>
                ) : (
                  <button className="nav-link">{t(item.labelKey)}</button>
                )}
                {renderDropdown(item, 'right')}
              </div>
            ))}

            <div className="flex items-center gap-3 ml-4">
              {/* Language Toggle */}
              <button
                onClick={toggleLanguage}
                className="text-[10px] tracking-[0.15em] font-inter border border-black px-2 py-1 hover:bg-black hover:text-white transition-colors"
              >
                {lang === 'en' ? 'VI' : 'EN'}
              </button>
              <button onClick={() => setSearchOpen(true)} className="hover:opacity-50 transition-opacity" aria-label="Search">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                </svg>
              </button>
              <div className="relative" ref={userMenuRef}>
                {user ? (
                  <button onClick={() => setUserMenuOpen(v => !v)}
                    className="flex items-center gap-1.5 hover:opacity-70 transition-opacity" aria-label="Account">
                    <div className="w-6 h-6 bg-black rounded-full flex items-center justify-center">
                      <span className="text-white text-[10px] font-inter font-medium leading-none">
                        {user.name?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  </button>
                ) : (
                  <button onClick={openAuthDrawer} className="hover:opacity-50 transition-opacity" aria-label="Đăng nhập">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                    </svg>
                  </button>
                )}
                {userMenuOpen && user && (
                  <div className="absolute right-0 top-full mt-2 bg-white border border-gray-100 shadow-lg py-3 px-1 min-w-[180px] z-50">
                    <p className="px-4 pb-2 text-[10px] tracking-[0.1em] uppercase text-warm-gray font-inter border-b border-gray-50">{user.name}</p>
                    <button onClick={() => { openAuthDrawer(); setUserMenuOpen(false); }}
                      className="w-full text-left px-4 py-2 text-xs tracking-[0.08em] font-inter hover:opacity-50 transition-opacity">Tài khoản</button>
                    <button onClick={() => { logout(); setUserMenuOpen(false); }}
                      className="w-full text-left px-4 py-2 text-xs tracking-[0.08em] font-inter hover:opacity-50 transition-opacity text-red-500">Đăng xuất</button>
                  </div>
                )}
              </div>
              <button onClick={() => setIsOpen(true)} className="relative hover:opacity-50 transition-opacity" aria-label="Cart">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/>
                  <path d="M16 10a4 4 0 0 1-8 0"/>
                </svg>
                {count > 0 && (
                  <span className="absolute -top-2 -right-2 bg-black text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-inter">{count}</span>
                )}
              </button>
            </div>
          </div>

          {/* Mobile right */}
          <div className="flex lg:hidden items-center gap-3 ml-auto">
            <button onClick={toggleLanguage} className="text-[10px] tracking-[0.15em] font-inter border border-black px-1.5 py-0.5">
              {lang === 'en' ? 'VI' : 'EN'}
            </button>
            <button onClick={openAuthDrawer} className="hover:opacity-50 transition-opacity" aria-label="Account">
              {user ? (
                <div className="w-6 h-6 bg-black rounded-full flex items-center justify-center">
                  <span className="text-white text-[10px] font-inter font-medium leading-none">{user.name?.charAt(0).toUpperCase()}</span>
                </div>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                </svg>
              )}
            </button>
            <button onClick={() => setSearchOpen(true)} aria-label="Search">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
            </button>
            <button onClick={() => setIsOpen(true)} className="relative" aria-label="Cart">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/>
                <path d="M16 10a4 4 0 0 1-8 0"/>
              </svg>
              {count > 0 && (
                <span className="absolute -top-2 -right-2 bg-black text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center">{count}</span>
              )}
            </button>
            <button onClick={() => setMobileOpen(true)} aria-label="Menu">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
              </svg>
            </button>
          </div>
        </nav>
      </header>

      {/* Search Overlay */}
      {searchOpen && (
        <div className="fixed inset-0 bg-white z-[100] flex flex-col items-center justify-center">
          <button onClick={() => setSearchOpen(false)} className="absolute top-6 right-6 text-2xl hover:opacity-50 transition-opacity">✕</button>
          <p className="font-cormorant text-sm tracking-[0.2em] uppercase mb-6 text-warm-gray">{t('nav.searchLabel')}</p>
          <form onSubmit={handleSearch} className="w-full max-w-xl px-8">
            <div className="border-b border-black flex items-center gap-4 pb-3">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-warm-gray flex-shrink-0">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
              <input
                autoFocus
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder={t('nav.searchPlaceholder')}
                className="w-full outline-none font-cormorant text-2xl font-light placeholder-gray-300"
              />
            </div>
            <button type="submit" className="mt-8 btn-dark mx-auto block">{t('nav.searchLabel')}</button>
          </form>
        </div>
      )}

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-white z-[100] overflow-y-auto">
          <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
            <Link to="/" className="font-cormorant text-lg tracking-[0.2em] uppercase">LUMIÈRE FERRÉ</Link>
            <button onClick={() => setMobileOpen(false)} className="text-xl">✕</button>
          </div>
          <div className="px-6 py-6 space-y-1">
            {NAV_ITEMS.map(item => (
              <div key={item.labelKey}>
                {item.href ? (
                  <Link to={item.href} className="block py-3 text-sm tracking-[0.15em] uppercase font-inter border-b border-gray-100">
                    {t(item.labelKey)}
                  </Link>
                ) : (
                  <>
                    <p className="py-3 text-sm tracking-[0.15em] uppercase font-inter text-warm-gray border-b border-gray-100">{t(item.labelKey)}</p>
                    <div className="pl-4">
                      {item.children?.map(child => (
                        <Link key={child.labelKey} to={child.href}
                          className="block py-2.5 text-xs tracking-[0.12em] uppercase font-inter border-b border-gray-50 hover:opacity-50">
                          {t(child.labelKey)}
                        </Link>
                      ))}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
          <div className="px-6 py-6 border-t border-gray-100">
            <Link to="/ve-chung-toi" className="block py-2 text-xs tracking-[0.15em] uppercase font-inter">{t('nav.about')}</Link>
            <Link to="/lien-he" className="block py-2 text-xs tracking-[0.15em] uppercase font-inter">{t('nav.contact')}</Link>
          </div>
        </div>
      )}
    </>
  );
}
