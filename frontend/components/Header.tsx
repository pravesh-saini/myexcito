
'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { fetchProducts, Product } from '@/lib/api';
import ThemeToggle from './ThemeToggle';

const RECENT_SEARCHES_KEY = 'excito_recent_searches_v1';
const SEARCH_ANALYTICS_KEY = 'excito_search_analytics_v1';
const SHOP_FILTERS_KEY = 'excito_shop_filters';
const MAX_RECENT_SEARCHES = 8;
const MAX_SUGGESTIONS = 8;
const MIN_AUTO_SEARCH_CHARS = 2;

type SearchSuggestion = {
  value: string;
  label: string;
  kind: 'recent' | 'product' | 'brand' | 'section';
};

type SearchAnalytics = {
  totalSearches: number;
  lastSearchAt: string;
  topQueries: Record<string, number>;
  sources: Record<string, number>;
};

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
  const [searchCatalog, setSearchCatalog] = useState<Product[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [user, setUser] = useState<{ id?: number; email: string; firstName?: string; first_name?: string } | null>(null);
  const [avatarDataUrl, setAvatarDataUrl] = useState('');
  const { totalItems: cartTotalItems } = useCart();
  const { totalItems: wishlistTotalItems } = useWishlist();
  const searchBoxRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const categoriesRef = useRef<HTMLDivElement>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout>(null);
  const liveSearchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTrackedRef = useRef<{ query: string; source: string; at: number } | null>(null);
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
    try {
      const raw = localStorage.getItem(RECENT_SEARCHES_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as string[];
        if (Array.isArray(parsed)) {
          setRecentSearches(parsed.filter(Boolean).slice(0, MAX_RECENT_SEARCHES));
        }
      }
    } catch {
      setRecentSearches([]);
    }

    let isCancelled = false;
    fetchProducts()
      .then((items) => {
        if (isCancelled) {
          return;
        }
        setSearchCatalog(items || []);
      })
      .catch(() => {
        if (!isCancelled) {
          setSearchCatalog([]);
        }
      });

    return () => {
      isCancelled = true;
    };
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
      if (searchBoxRef.current && !searchBoxRef.current.contains(target)) {
        setIsSearchFocused(false);
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
    setIsSearchFocused(false);
    setHoveredCard(null);
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
  }, [pathname]);

  const readStoredShopFilters = () => {
    try {
      const raw = localStorage.getItem(SHOP_FILTERS_KEY);
      if (!raw) {
        return { category: '', sort: '' };
      }

      const parsed = JSON.parse(raw) as { category?: string; sort?: string };
      return {
        category: (parsed.category || '').trim().toLowerCase(),
        sort: (parsed.sort || '').trim().toLowerCase(),
      };
    } catch {
      return { category: '', sort: '' };
    }
  };

  const persistRecentSearch = (query: string) => {
    const trimmed = query.trim();
    if (!trimmed) {
      return;
    }

    setRecentSearches((prev) => {
      const deduped = [trimmed, ...prev.filter((item) => item.toLowerCase() !== trimmed.toLowerCase())].slice(0, MAX_RECENT_SEARCHES);
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(deduped));
      return deduped;
    });
  };

  const trackSearchAnalytics = (query: string, source: string) => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) {
      return;
    }

    const now = Date.now();
    const lastTracked = lastTrackedRef.current;
    if (lastTracked && lastTracked.query === trimmed && lastTracked.source === source && now - lastTracked.at < 1200) {
      return;
    }

    lastTrackedRef.current = {
      query: trimmed,
      source,
      at: now,
    };

    const fallback: SearchAnalytics = {
      totalSearches: 0,
      lastSearchAt: '',
      topQueries: {},
      sources: {},
    };

    try {
      const raw = localStorage.getItem(SEARCH_ANALYTICS_KEY);
      const existing = raw ? (JSON.parse(raw) as SearchAnalytics) : fallback;
      const next: SearchAnalytics = {
        totalSearches: Number(existing.totalSearches || 0) + 1,
        lastSearchAt: new Date().toISOString(),
        topQueries: {
          ...(existing.topQueries || {}),
          [trimmed]: Number(existing.topQueries?.[trimmed] || 0) + 1,
        },
        sources: {
          ...(existing.sources || {}),
          [source]: Number(existing.sources?.[source] || 0) + 1,
        },
      };
      localStorage.setItem(SEARCH_ANALYTICS_KEY, JSON.stringify(next));
    } catch {
      localStorage.setItem(SEARCH_ANALYTICS_KEY, JSON.stringify(fallback));
    }
  };

  const buildShopSearchUrl = (query: string) => {
    const params = new URLSearchParams();
    const stored = readStoredShopFilters();

    const activeCategory = pathname.startsWith('/shop')
      ? (searchParams.get('category') || '').trim().toLowerCase()
      : stored.category;

    const activeSort = pathname.startsWith('/shop')
      ? (searchParams.get('sort') || '').trim().toLowerCase()
      : stored.sort;

    if (activeCategory && activeCategory !== 'all') {
      params.set('category', activeCategory);
    }

    if (activeSort && activeSort !== 'featured') {
      params.set('sort', activeSort);
    }

    if (query) {
      params.set('search', query);
    }

    const queryString = params.toString();
    return queryString ? `/shop?${queryString}` : '/shop';
  };

  const runSearchNavigation = (
    rawQuery: string,
    source: 'live' | 'submit' | 'suggestion' | 'recent',
    mode: 'replace' | 'push' = 'replace'
  ) => {
    const query = rawQuery.trim();
    const targetUrl = buildShopSearchUrl(query);

    if (query) {
      persistRecentSearch(query);
      trackSearchAnalytics(query, source);
    }

    if (mode === 'push') {
      router.push(targetUrl);
      return;
    }

    router.replace(targetUrl, { scroll: false });
  };

  const suggestionItems = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const suggestions: SearchSuggestion[] = [];
    const seen = new Set<string>();

    const addSuggestion = (item: SearchSuggestion) => {
      const key = `${item.kind}:${item.value.toLowerCase()}`;
      if (seen.has(key)) {
        return;
      }
      seen.add(key);
      suggestions.push(item);
    };

    if (!query) {
      recentSearches.slice(0, MAX_SUGGESTIONS).forEach((value) => {
        addSuggestion({ value, label: value, kind: 'recent' });
      });
      return suggestions;
    }

    recentSearches
      .filter((item) => item.toLowerCase().includes(query))
      .slice(0, 3)
      .forEach((value) => {
        addSuggestion({ value, label: value, kind: 'recent' });
      });

    if (query.length < MIN_AUTO_SEARCH_CHARS) {
      return suggestions;
    }

    searchCatalog
      .filter((product) => (product.name || '').toLowerCase().includes(query))
      .slice(0, 4)
      .forEach((product) => {
        addSuggestion({
          value: product.name,
          label: product.name,
          kind: 'product',
        });
      });

    Array.from(new Set(searchCatalog.map((product) => product.brand).filter(Boolean)))
      .filter((brand) => brand.toLowerCase().includes(query))
      .slice(0, 2)
      .forEach((brand) => {
        addSuggestion({
          value: brand,
          label: brand,
          kind: 'brand',
        });
      });

    Array.from(new Set(searchCatalog.map((product) => product.section).filter(Boolean)))
      .filter((section) => section.toLowerCase().includes(query))
      .slice(0, 2)
      .forEach((section) => {
        addSuggestion({
          value: section,
          label: section,
          kind: 'section',
        });
      });

    return suggestions.slice(0, MAX_SUGGESTIONS);
  }, [searchQuery, recentSearches, searchCatalog]);

  const showSuggestionDropdown = isSearchFocused && (suggestionItems.length > 0 || !!searchQuery.trim());

  useEffect(() => {
    if (!pathname.startsWith('/shop')) {
      return;
    }

    // Keep header input aligned with URL search only when the route param changes.
    // Do not depend on searchQuery here, otherwise manual typing gets reverted.
    setSearchQuery(currentSearchParam);
  }, [pathname, currentSearchParam]);

  useEffect(() => {
    if (liveSearchTimeoutRef.current) {
      clearTimeout(liveSearchTimeoutRef.current);
      liveSearchTimeoutRef.current = null;
    }

    const query = searchQuery.trim();

    if (!query) {
      if (pathname.startsWith('/shop') && currentSearchParam) {
        liveSearchTimeoutRef.current = setTimeout(() => {
          runSearchNavigation('', 'live', 'replace');
        }, 300);
      }

      return () => {
        if (liveSearchTimeoutRef.current) {
          clearTimeout(liveSearchTimeoutRef.current);
          liveSearchTimeoutRef.current = null;
        }
      };
    }

    if (query.length < MIN_AUTO_SEARCH_CHARS) {
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

      runSearchNavigation(query, 'live', 'replace');
    }, 300);

    return () => {
      if (liveSearchTimeoutRef.current) {
        clearTimeout(liveSearchTimeoutRef.current);
        liveSearchTimeoutRef.current = null;
      }
    };
  }, [searchQuery, pathname, currentSearchParam]);

  const handleLogout = () => {
    localStorage.removeItem('excito_user');
    window.dispatchEvent(new Event('excito-auth-changed'));
    setUser(null);
    setAvatarDataUrl('');
    setIsUserMenuOpen(false);
    router.push('/');
  };

  const clearSearchInput = () => {
    setSearchQuery('');
    if (pathname.startsWith('/shop') || currentSearchParam) {
      runSearchNavigation('', 'live', 'replace');
    }
  };

  const handleSearchInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== 'Escape') {
      return;
    }

    event.preventDefault();
    clearSearchInput();
    setIsSearchFocused(false);
    event.currentTarget.blur();
  };

  const handleSuggestionSelect = (suggestion: SearchSuggestion) => {
    setSearchQuery(suggestion.value);
    setIsSearchFocused(false);
    runSearchNavigation(suggestion.value, suggestion.kind === 'recent' ? 'recent' : 'suggestion', 'push');
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchQuery.trim();
    if (!query) {
      runSearchNavigation('', 'submit', 'push');
      return;
    }

    setIsSearchFocused(false);
    runSearchNavigation(query, 'submit', 'push');
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
            
            <Link href="/" className="text-xl md:text-2xl font-bold text-black dark:text-white cursor-pointer" style={{ fontFamily: '"Pacifico", serif' }}>
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
            <div className="hidden md:block w-72 relative" ref={searchBoxRef}>
              <form onSubmit={handleSearch}>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={searchQuery}
                    onFocus={() => setIsSearchFocused(true)}
                    onKeyDown={handleSearchInputKeyDown}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-4 py-2 pl-10 pr-9 border border-gray-300 dark:border-gray-800 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/20 dark:focus:ring-white/15 focus:border-transparent text-sm transition-all duration-300"
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <i className="ri-search-line text-gray-400 transition-colors duration-300"></i>
                  </div>
                  {searchQuery.trim() && (
                    <button
                      type="button"
                      onClick={clearSearchInput}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                      aria-label="Clear search"
                    >
                      <i className="ri-close-line text-lg"></i>
                    </button>
                  )}
                </div>
              </form>

              {showSuggestionDropdown && (
                <div className="absolute mt-2 w-72 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-2xl dark:border-gray-800 dark:bg-gray-950 z-[60]">
                  {searchQuery.trim().length > 0 && searchQuery.trim().length < MIN_AUTO_SEARCH_CHARS && (
                    <p className="px-3 py-2 text-xs text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-800">
                      Type at least {MIN_AUTO_SEARCH_CHARS} letters for live search.
                    </p>
                  )}

                  {suggestionItems.length > 0 ? (
                    <div className="max-h-72 overflow-y-auto py-1">
                      {suggestionItems.map((suggestion) => (
                        <button
                          key={`${suggestion.kind}-${suggestion.value}`}
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => handleSuggestionSelect(suggestion)}
                          className="w-full flex items-center justify-between gap-2 px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-900"
                        >
                          <span className="text-sm text-gray-800 dark:text-gray-200 truncate">{suggestion.label}</span>
                          <span className="text-[11px] uppercase tracking-wide text-gray-400">
                            {suggestion.kind}
                          </span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="px-3 py-3 text-sm text-gray-500 dark:text-gray-400">
                      No quick suggestions. Press Enter to search this term.
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center space-x-3">
              <ThemeToggle />
              <Link href="/wishlist" className="relative p-2 hover:bg-gray-100 dark:hover:bg-gray-900 rounded-full transition-all duration-300 cursor-pointer hover:scale-110">
                <i className="ri-heart-line text-gray-600 dark:text-gray-300 w-5 h-5 flex items-center justify-center transition-colors duration-300"></i>
                {wishlistTotalItems > 0 && <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs px-1 rounded-full animate-pulse">{wishlistTotalItems}</span>}
              </Link>
              <button onClick={() => router.push('/cart')} className="relative p-2 hover:bg-gray-100 dark:hover:bg-gray-900 rounded-full transition-all duration-300 cursor-pointer hover:scale-110">
                <i className="ri-shopping-cart-line text-gray-600 dark:text-gray-300 w-5 h-5 flex items-center justify-center transition-colors duration-300"></i>
                {cartTotalItems > 0 && <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs px-1 rounded-full animate-pulse">{cartTotalItems}</span>}
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
              aria-label="Toggle menu"
            >
              <i className={isMenuOpen ? "ri-close-line text-gray-600 dark:text-gray-300 text-xl" : "ri-menu-line text-gray-600 dark:text-gray-300 w-5 h-5 flex items-center justify-center transition-colors duration-300"}></i>
            </button>
          </div>
        </div>

        {/* Mobile Search Bar - Visible only on mobile when menu is not open or as a separate section */}
        <div className="md:hidden px-4 pb-4">
          <form onSubmit={handleSearch} className="relative">
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onFocus={() => setIsSearchFocused(true)}
              onKeyDown={handleSearchInputKeyDown}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 pl-10 pr-9 border border-gray-300 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/40 text-gray-900 dark:text-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/20 dark:focus:ring-white/15 text-sm transition-all duration-300"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <i className="ri-search-line text-gray-400"></i>
            </div>
            {searchQuery.trim() && (
              <button
                type="button"
                onClick={clearSearchInput}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400"
              >
                <i className="ri-close-line text-lg"></i>
              </button>
            )}
          </form>
          {showSuggestionDropdown && (
            <div className="absolute left-4 right-4 mt-1 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-2xl dark:border-gray-800 dark:bg-gray-950 z-[60]">
              {suggestionItems.length > 0 ? (
                <div className="max-h-60 overflow-y-auto py-1">
                  {suggestionItems.map((suggestion) => (
                    <button
                      key={`${suggestion.kind}-${suggestion.value}`}
                      type="button"
                      onClick={() => handleSuggestionSelect(suggestion)}
                      className="w-full flex items-center justify-between gap-2 px-4 py-2.5 text-left hover:bg-gray-50 dark:hover:bg-gray-900"
                    >
                      <span className="text-sm text-gray-800 dark:text-gray-200 truncate">{suggestion.label}</span>
                      <span className="text-[10px] uppercase tracking-wide text-gray-400">{suggestion.kind}</span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                  Press Enter to search "{searchQuery}"
                </div>
              )}
            </div>
          )}
        </div>

        {isMenuOpen && (
          <div className="md:hidden fixed inset-0 top-16 bg-white dark:bg-gray-950 z-40 overflow-y-auto animate-in slide-in-from-right duration-300">
            <div className="p-4 space-y-6">
              <nav className="flex flex-col space-y-2">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 px-2">Navigation</p>
                {navLinks.map((link) => {
                  const isActive = link.href === '/' ? pathname === '/' : pathname.startsWith(link.href);
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`px-4 py-3 rounded-xl text-base font-semibold transition-all ${
                        isActive 
                          ? (link.isAccent ? 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400' : 'bg-gray-100 text-gray-900 dark:bg-gray-900 dark:text-white')
                          : (link.isAccent ? 'text-red-600' : 'text-gray-700 dark:text-gray-300')
                      }`}
                    >
                      {link.label}
                    </Link>
                  );
                })}
              </nav>

              <div className="space-y-4">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest px-2">Categories</p>
                <div className="grid grid-cols-2 gap-3">
                  {categoryCards.map((card) => (
                    <Link
                      key={card.href}
                      href={card.href}
                      className="relative h-24 rounded-xl overflow-hidden group"
                    >
                      <div 
                        className="absolute inset-0 bg-cover bg-center"
                        style={{ backgroundImage: `url('${card.imageUrl}')` }}
                      />
                      <div className={`absolute inset-0 bg-gradient-to-b ${card.bannerGradient} opacity-80`} />
                      <div className="absolute inset-0 flex items-center justify-center p-2">
                        <span className="text-white text-sm font-bold text-center leading-tight">{card.title}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>

              {!user && (
                <div className="grid grid-cols-2 gap-3 pt-4 border-t border-gray-100 dark:border-gray-900">
                  <Link href="/login" className="flex items-center justify-center bg-gray-900 dark:bg-white text-white dark:text-gray-900 py-3 rounded-xl font-bold text-sm">
                    Sign In
                  </Link>
                  <Link href="/signup" className="flex items-center justify-center border border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 py-3 rounded-xl font-bold text-sm">
                    Register
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      </header>
    </>
  );
}
