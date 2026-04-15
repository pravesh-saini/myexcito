
'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import ThemeToggle from './ThemeToggle';

type CategoryCard = {
  href: string;
  title: string;
  subtitle: string;
  icon: string;
  iconBg: string;
  quickLinks: string[];
  imageUrl: string;
  bannerGradient: string;
};

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [user, setUser] = useState<{ id?: number; email: string; firstName?: string; first_name?: string } | null>(null);
  const [avatarDataUrl, setAvatarDataUrl] = useState('');
  const { totalItems } = useCart();
  const userMenuRef = useRef<HTMLDivElement>(null);
  const categoriesRef = useRef<HTMLDivElement>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout>(null);
  const liveSearchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentSearchParam = (searchParams.get('search') || '').trim();

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/shop', label: 'Shop' },
    { href: '/collections', label: 'Collections' },
    { href: '/sale', label: 'Sale', isAccent: true },
  ];

  const categoryCards: CategoryCard[] = [
    {
      href: '/men',
      title: "Men's Collection",
      subtitle: 'Power and performance fits',
      icon: 'ri-user-3-line',
      iconBg: 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300',
      quickLinks: ['T-Shirts & Tops', 'Pants & Shorts', 'Activewear'],
      imageUrl: 'https://images.unsplash.com/photo-1616714712032-5eb97ba4ddc5?q=80&w=400&h=300&fit=crop',
      bannerGradient: 'from-blue-600/60 to-blue-900/60',
    },
    {
      href: '/women',
      title: "Women's Collection",
      subtitle: 'Training looks with comfort',
      icon: 'ri-women-line',
      iconBg: 'bg-pink-100 text-pink-700 dark:bg-pink-950/60 dark:text-pink-300',
      quickLinks: ['Dresses & Tops', 'Bottoms', 'Sportswear'],
      imageUrl: 'https://images.unsplash.com/photo-1581506236351-8c2c36b8bcc9?q=80&w=400&h=300&fit=crop',
      bannerGradient: 'from-pink-600/60 to-pink-900/60',
    },
    {
      href: '/kids',
      title: 'Kids Collection',
      subtitle: 'Play-ready essentials',
      icon: 'ri-emotion-happy-line',
      iconBg: 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300',
      quickLinks: ['Boys Clothing', 'Girls Clothing', 'Active Kids'],
      imageUrl: 'https://images.unsplash.com/photo-1503919545889-06f81ea7f407?q=80&w=400&h=300&fit=crop',
      bannerGradient: 'from-amber-600/60 to-amber-900/60',
    },
    {
      href: '/sale',
      title: 'Sale & Deals',
      subtitle: 'Best discounts right now',
      icon: 'ri-fire-line',
      iconBg: 'bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300',
      quickLinks: ['Limited Offers', 'Top Picks', 'Clearance'],
      imageUrl: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?q=80&w=400&h=300&fit=crop',
      bannerGradient: 'from-red-600/60 to-red-900/60',
    },
  ];

  useEffect(() => {
    const syncUserFromStorage = () => {
      const stored = localStorage.getItem('excito_user');
      if (!stored) {
        setUser(null);
        setAvatarDataUrl('');
        return;
      }

      try {
        const parsed = JSON.parse(stored) as { id?: number; email: string; firstName?: string; first_name?: string };
        setUser(parsed);

        const rawProfile = localStorage.getItem(`excito_profile_${String(parsed.email || '').toLowerCase()}`);
        if (!rawProfile) {
          setAvatarDataUrl('');
          return;
        }

        const profile = JSON.parse(rawProfile) as { avatarDataUrl?: string };
        setAvatarDataUrl(profile.avatarDataUrl || '');
      } catch {
        setUser(null);
        setAvatarDataUrl('');
      }
    };

    syncUserFromStorage();

    const onAuthChanged = () => syncUserFromStorage();
    window.addEventListener('excito-auth-changed', onAuthChanged as EventListener);
    return () => window.removeEventListener('excito-auth-changed', onAuthChanged as EventListener);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (userMenuRef.current && !userMenuRef.current.contains(target)) {
        setIsUserMenuOpen(false);
      }
      if (categoriesRef.current && !categoriesRef.current.contains(target)) {
        setIsCategoriesOpen(false);
        setHoveredCard(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    setIsCategoriesOpen(false);
    setIsMenuOpen(false);
    setHoveredCard(null);
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
  }, [pathname]);

  useEffect(() => {
    if (!pathname.startsWith('/shop')) {
      return;
    }

    if (searchQuery !== currentSearchParam) {
      setSearchQuery(currentSearchParam);
    }
  }, [pathname, currentSearchParam, searchQuery]);

  useEffect(() => {
    if (liveSearchTimeoutRef.current) {
      clearTimeout(liveSearchTimeoutRef.current);
      liveSearchTimeoutRef.current = null;
    }

    const query = searchQuery.trim();

    if (!query) {
      if (pathname.startsWith('/shop') && currentSearchParam) {
        liveSearchTimeoutRef.current = setTimeout(() => {
          router.replace('/shop', { scroll: false });
        }, 300);
      }

      return () => {
        if (liveSearchTimeoutRef.current) {
          clearTimeout(liveSearchTimeoutRef.current);
          liveSearchTimeoutRef.current = null;
        }
      };
    }

    liveSearchTimeoutRef.current = setTimeout(() => {
      if (pathname.startsWith('/shop') && currentSearchParam === query) {
        return;
      }

      router.replace(`/shop?search=${encodeURIComponent(query)}`, { scroll: false });
    }, 300);

    return () => {
      if (liveSearchTimeoutRef.current) {
        clearTimeout(liveSearchTimeoutRef.current);
        liveSearchTimeoutRef.current = null;
      }
    };
  }, [searchQuery, pathname, currentSearchParam, router]);

  const handleLogout = () => {
    localStorage.removeItem('excito_user');
    window.dispatchEvent(new Event('excito-auth-changed'));
    setUser(null);
    setAvatarDataUrl('');
    setIsUserMenuOpen(false);
    router.push('/');
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchQuery.trim();
    if (!query) {
      router.push('/shop');
      return;
    }

    router.push(`/shop?search=${encodeURIComponent(query)}`);
  };

  return (
    <>
      <header className="bg-white dark:bg-gray-950 shadow-sm sticky top-0 z-50 border-b border-transparent dark:border-gray-900 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 lg:px-8 transition-all duration-300">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-2">
            <div
              className="relative hidden md:block"
              ref={categoriesRef}
              onMouseEnter={() => {
                if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
                hoverTimeoutRef.current = setTimeout(() => {
                  setIsCategoriesOpen(true);
                }, 150);
              }}
              onMouseLeave={() => {
                if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
                hoverTimeoutRef.current = setTimeout(() => {
                  setIsCategoriesOpen(false);
                }, 200);
              }}
            >
              <button
                onClick={() => setIsCategoriesOpen(!isCategoriesOpen)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-900 rounded-lg transition-colors duration-200 cursor-pointer flex items-center space-x-2"
                aria-expanded={isCategoriesOpen}
                aria-label="Open categories menu"
              >
                <div className="w-5 h-5 flex flex-col justify-center space-y-1">
                  <div className="w-full h-0.5 bg-gray-700 dark:bg-gray-200 transition-colors duration-200"></div>
                  <div className="w-full h-0.5 bg-gray-700 dark:bg-gray-200 transition-colors duration-200"></div>
                  <div className="w-full h-0.5 bg-gray-700 dark:bg-gray-200 transition-colors duration-200"></div>
                </div>
                <span className="text-gray-700 dark:text-gray-200 font-medium hidden md:block transition-colors duration-200">Categories</span>
                <i className={`hidden md:block ri-arrow-down-s-line text-gray-500 transition-transform duration-300 ${isCategoriesOpen ? 'rotate-180' : ''}`}></i>
              </button>

              {isCategoriesOpen && (
                <div className="absolute top-full left-0 mt-2 z-50 w-[44rem] max-w-[90vw] rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-gray-800 dark:bg-gray-950 hidden md:block animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="grid grid-cols-2 gap-4 p-4">
                    {categoryCards.map((card) => (
                      <Link
                        key={card.href}
                        href={card.href}
                        className="group relative rounded-xl overflow-hidden border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/40 h-56 hover:border-gray-300 dark:hover:border-gray-700 transition-all duration-300 hover:shadow-lg"
                        onMouseEnter={() => setHoveredCard(card.href)}
                        onMouseLeave={() => setHoveredCard(null)}
                      >
                        {/* Banner Image Background */}
                        <div
                          className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
                          style={{
                            backgroundImage: `url('${card.imageUrl}')`,
                          }}
                        />
                        
                        {/* Gradient Overlay */}
                        <div className={`absolute inset-0 bg-gradient-to-b ${card.bannerGradient} transition-opacity duration-300 group-hover:opacity-70`} />
                        
                        {/* Content */}
                        <div className="relative h-full p-4 flex flex-col justify-between">
                          <div>
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 transition-transform duration-300 ${card.iconBg} ${hoveredCard === card.href ? 'scale-110' : ''}`}>
                              <i className={`${card.icon} text-lg`}></i>
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <p className="font-bold text-white text-lg leading-tight group-hover:translate-x-1 transition-transform duration-300">
                              {card.title}
                            </p>
                            <p className="text-xs text-gray-100 opacity-90 group-hover:opacity-100 transition-opacity duration-300">
                              {card.subtitle}
                            </p>
                            <div className="flex flex-wrap gap-2 pt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                              {card.quickLinks.slice(0, 2).map((item) => (
                                <span key={item} className="text-[10px] px-2 py-1 rounded-full bg-white/20 backdrop-blur-sm text-white border border-white/30 hover:bg-white/30 transition-colors duration-200">
                                  {item}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                        
                        {/* Hover Arrow Indicator */}
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <i className="ri-arrow-right-line text-white text-2xl transform group-hover:translate-x-1 transition-transform duration-300"></i>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <Link href="/" className="text-2xl font-bold text-black dark:text-white cursor-pointer" style={{ fontFamily: '"Pacifico", serif' }}>
              EXCITO
            </Link>
          </div>
          
          <nav className="hidden md:flex items-center space-x-2 rounded-full border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/40 px-2 py-1 transition-all duration-300">
            {navLinks.map((link) => {
              const isActive = link.href === '/' ? pathname === '/' : pathname.startsWith(link.href);
              const baseClasses = 'px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-300 cursor-pointer';
              const activeClasses = link.isAccent
                ? 'bg-red-100 text-red-700 dark:bg-red-950/70 dark:text-red-300 shadow-md'
                : 'bg-white text-gray-900 shadow-sm dark:bg-gray-950 dark:text-gray-100';
              const idleClasses = link.isAccent
                ? 'text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40'
                : 'text-gray-700 dark:text-gray-200 hover:text-black dark:hover:text-white hover:bg-white/70 dark:hover:bg-gray-900';

              return (
                <Link key={link.href} href={link.href} className={`${baseClasses} ${isActive ? activeClasses : idleClasses}`}>
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center space-x-4">
            <form onSubmit={handleSearch} className="hidden md:block">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-64 px-4 py-2 pl-10 border border-gray-300 dark:border-gray-800 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/20 dark:focus:ring-white/15 focus:border-transparent text-sm transition-all duration-300"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <i className="ri-search-line text-gray-400 transition-colors duration-300"></i>
                </div>
              </div>
            </form>

            <div className="flex items-center space-x-3">
              <ThemeToggle />
              <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-900 rounded-full transition-all duration-300 cursor-pointer hover:scale-110">
                <i className="ri-heart-line text-gray-600 dark:text-gray-300 w-5 h-5 flex items-center justify-center transition-colors duration-300"></i>
              </button>
              <button onClick={() => router.push('/cart')} className="relative p-2 hover:bg-gray-100 dark:hover:bg-gray-900 rounded-full transition-all duration-300 cursor-pointer hover:scale-110">
                <i className="ri-shopping-cart-line text-gray-600 dark:text-gray-300 w-5 h-5 flex items-center justify-center transition-colors duration-300"></i>
                {totalItems > 0 && <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs px-1 rounded-full animate-pulse">{totalItems}</span>}
              </button>

              {/* User menu */}
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setIsUserMenuOpen(p => !p)}
                  className="flex items-center space-x-1.5 p-1.5 hover:bg-gray-100 dark:hover:bg-gray-900 rounded-full transition-all duration-300 cursor-pointer hover:scale-110"
                >
                  {user ? (
                    avatarDataUrl ? (
                      <img
                        src={avatarDataUrl}
                        alt="Profile"
                        className="w-7 h-7 rounded-full object-cover border border-gray-200 dark:border-gray-800"
                      />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-gray-900 dark:bg-white flex items-center justify-center transition-transform duration-300">
                        <span className="text-white text-xs font-bold dark:text-gray-900">{(user.firstName || user.first_name || user.email)[0].toUpperCase()}</span>
                      </div>
                    )
                  ) : (
                    <i className="ri-user-line text-gray-600 dark:text-gray-300 w-5 h-5 flex items-center justify-center transition-colors duration-300"></i>
                  )}
                </button>

                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-52 bg-white dark:bg-gray-950 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    {user ? (
                      <>
                        <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
                          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                            {user.firstName || user.first_name ? (user.firstName || user.first_name) : user.email.split('@')[0]}
                          </p>
                          <p className="text-xs text-gray-400 truncate">{user.email}</p>
                        </div>
                        <div className="py-1">
                          <Link href="/orders" onClick={() => setIsUserMenuOpen(false)}
                            className="flex items-center space-x-2 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors duration-200">
                            <i className="ri-file-list-line text-gray-400"></i>
                            <span>My Orders</span>
                          </Link>
                          <Link href="/wishlist" onClick={() => setIsUserMenuOpen(false)}
                            className="flex items-center space-x-2 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors duration-200">
                            <i className="ri-heart-line text-gray-400"></i>
                            <span>Wishlist</span>
                          </Link>
                          <Link href="/account" onClick={() => setIsUserMenuOpen(false)}
                            className="flex items-center space-x-2 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors duration-200">
                            <i className="ri-settings-line text-gray-400"></i>
                            <span>Account Settings</span>
                          </Link>
                          <div className="border-t border-gray-100 dark:border-gray-800 mt-1 pt-1">
                            <button onClick={handleLogout}
                              className="w-full flex items-center space-x-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors duration-200">
                              <i className="ri-logout-box-r-line"></i>
                              <span>Sign Out</span>
                            </button>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="p-3 space-y-2">
                        <Link href="/login" onClick={() => setIsUserMenuOpen(false)}
                          className="block w-full text-center bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-semibold py-2.5 rounded-xl hover:bg-gray-700 dark:hover:bg-gray-100 transition-all duration-300 hover:shadow-lg">
                          Sign In
                        </Link>
                        <Link href="/signup" onClick={() => setIsUserMenuOpen(false)}
                          className="block w-full text-center border border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-200 text-sm font-medium py-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-900 transition-all duration-300">
                          Create Account
                        </Link>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-900 rounded-full transition-all duration-300 cursor-pointer"
            >
              <i className="ri-menu-line text-gray-600 dark:text-gray-300 w-5 h-5 flex items-center justify-center transition-colors duration-300"></i>
            </button>
          </div>
        </div>

        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200 dark:border-gray-900">
            <nav className="flex flex-col space-y-4">
              {navLinks.map((link) => {
                const isActive = link.href === '/' ? pathname === '/' : pathname.startsWith(link.href);
                const activeClasses = link.isAccent
                  ? 'text-red-700 bg-red-50 dark:text-red-300 dark:bg-red-950/50'
                  : 'text-gray-900 dark:text-gray-100 bg-gray-100 dark:bg-gray-900';
                const idleClasses = link.isAccent
                  ? 'text-red-600 hover:text-red-700'
                  : 'text-gray-700 dark:text-gray-200 hover:text-black dark:hover:text-white';

                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setIsMenuOpen(false)}
                    className={`rounded-lg px-2 py-1.5 transition-colors cursor-pointer font-medium ${isActive ? activeClasses : idleClasses}`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>
            <div className="mt-4 rounded-xl border border-gray-200 dark:border-gray-800 p-3 bg-gray-50 dark:bg-gray-900/40">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">Browse Categories</p>
              <div className="grid grid-cols-2 gap-2">
                {categoryCards.map((card) => (
                  <Link
                    key={`mobile-${card.href}`}
                    href={card.href}
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center gap-2 rounded-lg px-2 py-2 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800"
                  >
                    <span className={`w-7 h-7 rounded-lg flex items-center justify-center ${card.iconBg}`}>
                      <i className={`${card.icon} text-sm`}></i>
                    </span>
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-200">{card.title.replace(' Collection', '')}</span>
                  </Link>
                ))}
              </div>
            </div>
            <form onSubmit={handleSearch} className="mt-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 pl-10 border border-gray-300 dark:border-gray-800 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/20 dark:focus:ring-white/15 focus:border-transparent text-sm"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <i className="ri-search-line text-gray-400"></i>
                </div>
              </div>
            </form>
          </div>
        )}
      </div>
      </header>
    </>
  );
}
