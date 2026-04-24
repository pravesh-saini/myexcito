'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import Footer from '@/components/Footer';
import { fetchProducts, Product } from '@/lib/api';
import QuickAddModal from '@/components/QuickAddModal';

const SHOP_CATEGORIES = ['all', 'men', 'women', 'kids', 'sale'] as const;
const SHOP_SORTS = ['featured', 'newest', 'price-low', 'price-high', 'sale'] as const;
const SHOP_FILTERS_KEY = 'excito_shop_filters';

const COLOR_MAP: Record<string, string> = {
  black: 'bg-black',
  white: 'bg-white border border-gray-300',
  gray: 'bg-gray-400',
  navy: 'bg-blue-900',
  blue: 'bg-blue-500',
  red: 'bg-red-500',
  green: 'bg-green-500',
  purple: 'bg-purple-500',
  teal: 'bg-teal-500',
  pink: 'bg-pink-400',
  olive: 'bg-green-700',
  multicolor: 'bg-gradient-to-r from-red-400 via-yellow-400 to-blue-400',
};

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const isValidCategory = (value: string): value is (typeof SHOP_CATEGORIES)[number] =>
  SHOP_CATEGORIES.includes(value as (typeof SHOP_CATEGORIES)[number]);

const isValidSort = (value: string): value is (typeof SHOP_SORTS)[number] =>
  SHOP_SORTS.includes(value as (typeof SHOP_SORTS)[number]);

const highlightMatch = (text: string, query: string) => {
  const normalized = query.trim();
  if (normalized.length < 2) {
    return text;
  }

  const regex = new RegExp(`(${escapeRegExp(normalized)})`, 'ig');
  const parts = text.split(regex);

  return parts.map((part, index) =>
    part.toLowerCase() === normalized.toLowerCase() ? (
      <mark key={`${part}-${index}`} className="rounded bg-yellow-200/70 px-0.5 text-gray-900 dark:bg-yellow-300/30 dark:text-yellow-100">
        {part}
      </mark>
    ) : (
      <span key={`${part}-${index}`}>{part}</span>
    )
  );
};

export default function ShopPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<(typeof SHOP_CATEGORIES)[number]>('all');
  const [sortBy, setSortBy] = useState<(typeof SHOP_SORTS)[number]>('featured');
  const [quickAdd, setQuickAdd] = useState<{ product: Product; size: string; color: string } | null>(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  useEffect(() => {
    const urlSearch = (searchParams.get('search') || '').trim();
    const urlCategory = (searchParams.get('category') || 'all').trim().toLowerCase();
    const urlSort = (searchParams.get('sort') || 'featured').trim().toLowerCase();

    setSearch(urlSearch);
    setCategory(isValidCategory(urlCategory) ? urlCategory : 'all');
    setSortBy(isValidSort(urlSort) ? urlSort : 'featured');
  }, [searchParams]);

  const buildShopUrl = (next: { search?: string; category?: string; sort?: string }) => {
    const params = new URLSearchParams(searchParams.toString());
    const nextSearch = (next.search ?? search).trim();
    const nextCategory = (next.category ?? category).trim().toLowerCase();
    const nextSort = (next.sort ?? sortBy).trim().toLowerCase();

    if (nextSearch) {
      params.set('search', nextSearch);
    } else {
      params.delete('search');
    }

    if (nextCategory && nextCategory !== 'all') {
      params.set('category', nextCategory);
    } else {
      params.delete('category');
    }

    if (nextSort && nextSort !== 'featured') {
      params.set('sort', nextSort);
    } else {
      params.delete('sort');
    }

    const queryString = params.toString();
    return queryString ? `${pathname}?${queryString}` : pathname;
  };

  useEffect(() => {
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
      searchDebounceRef.current = null;
    }

    searchDebounceRef.current = setTimeout(() => {
      const currentSearch = (searchParams.get('search') || '').trim();
      const nextSearch = search.trim();
      if (currentSearch === nextSearch) {
        return;
      }

      router.replace(buildShopUrl({ search: nextSearch }), { scroll: false });
    }, 250);

    return () => {
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current);
        searchDebounceRef.current = null;
      }
    };
  }, [search, searchParams, router, pathname, category, sortBy]);

  useEffect(() => {
    localStorage.setItem(
      SHOP_FILTERS_KEY,
      JSON.stringify({
        category,
        sort: sortBy,
      })
    );
  }, [category, sortBy]);

  useEffect(() => {
    setLoading(true);
    setError('');

    fetchProducts()
      .then(setProducts)
      .catch(() => setError('Could not load products. Is the backend running on port 8000?'))
      .finally(() => setLoading(false));
  }, []);

  const filteredProducts = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    const filtered = products.filter((product) => {
      const categoryMatch = category === 'all' || product.category === category;
      const searchMatch =
        !normalizedSearch ||
        product.name.toLowerCase().includes(normalizedSearch) ||
        product.brand.toLowerCase().includes(normalizedSearch) ||
        product.section.toLowerCase().includes(normalizedSearch);

      return categoryMatch && searchMatch;
    });

    return filtered.sort((a, b) => {
      if (sortBy === 'price-low') return Number(a.price) - Number(b.price);
      if (sortBy === 'price-high') return Number(b.price) - Number(a.price);
      if (sortBy === 'newest') return Number(b.id) - Number(a.id);
      if (sortBy === 'sale') {
        const aDiscount = Number(a.discount || 0);
        const bDiscount = Number(b.discount || 0);
        return bDiscount - aDiscount;
      }
      return 0;
    });
  }, [products, search, category, sortBy]);

  const emptyStateSuggestions = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) {
      return ['running', 't-shirt', 'joggers', 'hoodie'];
    }

    const token = query.split(/\s+/)[0];
    const productNames = products
      .filter((product) => (product.name || '').toLowerCase().includes(token))
      .slice(0, 4)
      .map((product) => product.name);

    const sections = Array.from(new Set(products.map((product) => product.section).filter(Boolean)))
      .filter((section) => section.toLowerCase().includes(token))
      .slice(0, 2);

    const combined = [...productNames, ...sections];
    if (!combined.length) {
      return ['running', 'training', 'sale', 'activewear'];
    }

    return Array.from(new Set(combined)).slice(0, 6);
  }, [products, search]);

  const openQuickAdd = (product: Product) => {
    setQuickAdd({
      product,
      size: product.sizes?.[0] || '',
      color: product.colors?.[0] || '',
    });
  };

  const handleCategoryChange = (value: string) => {
    const nextCategory = isValidCategory(value) ? value : 'all';
    setCategory(nextCategory);
    router.replace(buildShopUrl({ category: nextCategory }), { scroll: false });
  };

  const handleSortChange = (value: string) => {
    const nextSort = isValidSort(value) ? value : 'featured';
    setSortBy(nextSort);
    router.replace(buildShopUrl({ sort: nextSort }), { scroll: false });
  };

  const resetSearchAndFilters = () => {
    setSearch('');
    setCategory('all');
    setSortBy('featured');
    router.replace(pathname, { scroll: false });
  };

  const applySuggestedSearch = (value: string) => {
    setSearch(value);
    router.replace(buildShopUrl({ search: value }), { scroll: false });
  };

  return (
    <>
      <main className="min-h-screen bg-[linear-gradient(180deg,#f8fafc_0%,#eef2ff_40%,#ffffff_100%)] dark:bg-gray-950">
        <section className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
          <div className="md:hidden mb-6">
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className="w-full flex items-center justify-between bg-white dark:bg-gray-900 px-5 py-4 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm"
            >
              <div className="flex items-center gap-3">
                <i className="ri-equalizer-line text-lg text-gray-500"></i>
                <span className="font-bold text-gray-900 dark:text-gray-100">Filters & Sorting</span>
              </div>
              <i className={`ri-arrow-down-s-line text-xl transition-transform duration-300 ${isFilterOpen ? 'rotate-180' : ''}`}></i>
            </button>
          </div>

          <div className={`${isFilterOpen ? 'block' : 'hidden'} md:block rounded-2xl border border-gray-200 bg-white/90 p-4 shadow-sm backdrop-blur dark:border-gray-800 dark:bg-gray-950/90 md:p-6 mb-8`}>
            <div className="grid gap-6 md:grid-cols-4">
              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Search</label>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Find products, brands, sections..."
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-gray-500 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-100"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Category</label>
                <select
                  value={category}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-gray-500 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-100"
                >
                  {SHOP_CATEGORIES.map((item) => (
                    <option key={item} value={item}>
                      {item === 'all' ? 'All Categories' : item[0].toUpperCase() + item.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Sort</label>
                <select
                  value={sortBy}
                  onChange={(e) => handleSortChange(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-gray-500 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-100"
                >
                  <option value="featured">Featured</option>
                  <option value="newest">Newest</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="sale">Biggest Discount</option>
                </select>
              </div>
            </div>
          </div>

          <div className="mt-8 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">All Products</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">{filteredProducts.length} item(s)</p>
          </div>

          {loading && (
            <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {[...Array(12)].map((_, i) => (
                <div key={i} className="animate-pulse rounded-2xl border border-gray-200 bg-white p-2 dark:border-gray-800 dark:bg-gray-900">
                  <div className="aspect-[4/5] rounded-xl bg-gray-200 dark:bg-gray-800"></div>
                  <div className="mt-4 h-3 w-3/4 rounded bg-gray-200 dark:bg-gray-800"></div>
                  <div className="mt-2 h-3 w-1/2 rounded bg-gray-200 dark:bg-gray-800"></div>
                </div>
              ))}
            </div>
          )}

          {!loading && error && (
            <div className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-6 text-center dark:border-red-900/50 dark:bg-red-950/30">
              <p className="font-medium text-red-700 dark:text-red-300">{error}</p>
            </div>
          )}

          {!loading && !error && filteredProducts.length === 0 && (
            <div className="mt-8 rounded-2xl border border-gray-200 bg-white p-10 text-center dark:border-gray-800 dark:bg-gray-900">
              <p className="text-lg font-medium text-gray-700 dark:text-gray-200">
                No products matched{search.trim() ? ` "${search.trim()}"` : ' your current filters'}.
              </p>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Try quick suggestions below or reset all filters.</p>
              <div className="mt-5 flex flex-wrap justify-center gap-2">
                {emptyStateSuggestions.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => applySuggestedSearch(item)}
                    className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
                  >
                    {item}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={resetSearchAndFilters}
                className="mt-5 rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
              >
                Clear Search and Filters
              </button>
            </div>
          )}

          {!loading && !error && filteredProducts.length > 0 && (
            <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {filteredProducts.map((product, idx) => (
                <article
                  key={product.id}
                  className="group animate-card-in overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition hover:shadow-lg dark:border-gray-800 dark:bg-gray-900"
                  style={{ animationDelay: `${(idx % 8) * 50}ms` }}
                  onClick={() => product.stock_count > 0 && openQuickAdd(product)}
                >
                  <div className="relative">
                    {product.image_url ? (
                      <img src={product.image_url} alt={product.name} className="aspect-[4/5] w-full object-cover object-top transition duration-300 group-hover:scale-105" />
                    ) : (
                      <div className="flex aspect-[4/5] w-full items-center justify-center bg-gray-100 dark:bg-gray-800">
                        <i className="ri-image-line text-3xl text-gray-400"></i>
                      </div>
                    )}
                    {product.on_sale && (
                      <span className="absolute left-3 top-3 rounded-full bg-red-600 px-3 py-1 text-xs font-semibold text-white">Sale</span>
                    )}
                    {product.is_new && (
                      <span className="absolute right-3 top-3 rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-semibold text-white">New</span>
                    )}
                  </div>

                  <div className="p-2.5 sm:p-3">
                    <h3 className="line-clamp-1 text-xs sm:text-sm font-semibold text-gray-900 dark:text-gray-100">{highlightMatch(product.name, search)}</h3>
                    <p className="mt-0.5 text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">
                      {highlightMatch(product.brand || 'Excito', search)} • {highlightMatch(product.section || 'All', search)}
                    </p>

                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {(product.colors || []).slice(0, 5).map((color, index) => (
                        <span
                          key={`${product.id}-${color}-${index}`}
                          className={`h-3 w-3 rounded-full ${COLOR_MAP[color] || 'bg-gray-300'}`}
                          title={color}
                        ></span>
                      ))}
                    </div>

                    <div className="mt-2 sm:mt-3 flex items-center gap-2">
                      <span className="text-sm sm:text-base font-bold text-gray-900 dark:text-gray-100">Rs {Number(product.price).toLocaleString()}</span>
                      {product.original_price && (
                        <span className="text-[10px] sm:text-xs text-gray-500 line-through dark:text-gray-400">Rs {Number(product.original_price).toLocaleString()}</span>
                      )}
                    </div>

                    <button
                      onClick={() => openQuickAdd(product)}
                      disabled={product.stock_count <= 0}
                      className="mt-3 w-full rounded-lg bg-gray-900 px-3 py-2 text-xs font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-300 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200 dark:disabled:bg-gray-700"
                    >
                      {product.stock_count > 0 ? 'Select Options' : 'Out of Stock'}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <QuickAddModal quickAdd={quickAdd} onClose={() => setQuickAdd(null)} />

        <section className="relative overflow-hidden px-4 py-14 lg:px-8">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage:
                "url('https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=2000&q=80')",
            }}
          ></div>
          <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/55 to-black/70"></div>
          <div className="relative mx-auto max-w-7xl">
            <p className="inline-flex rounded-full bg-white/20 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white backdrop-blur">
              Excito Store
            </p>
            <h1 className="mt-4 max-w-3xl text-4xl font-bold leading-tight text-white md:text-5xl">
              Shop high-performance apparel designed for everyday athletes.
            </h1>
            <p className="mt-4 max-w-2xl text-base text-gray-200 md:text-lg">
              Explore the latest drops, timeless essentials, and limited sale picks in one place.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/collections" className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-black transition hover:bg-gray-100">
                View Collections
              </Link>
              <Link href="/sale" className="rounded-full border border-white/70 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white hover:text-black">
                Open Sale
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
