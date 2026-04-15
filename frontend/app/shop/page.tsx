'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import Footer from '@/components/Footer';
import { fetchProducts, Product } from '@/lib/api';
import QuickAddModal from '@/components/QuickAddModal';

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

export default function ShopPage() {
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [sortBy, setSortBy] = useState('featured');
  const [quickAdd, setQuickAdd] = useState<{ product: Product; size: string; color: string } | null>(null);

  useEffect(() => {
    const query = (searchParams.get('search') || '').trim();
    setSearch(query);
  }, [searchParams]);

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

  const categories = ['all', 'men', 'women', 'kids', 'sale'];

  const openQuickAdd = (product: Product) => {
    setQuickAdd({
      product,
      size: product.sizes?.[0] || '',
      color: product.colors?.[0] || '',
    });
  };

  return (
    <>
      <main className="min-h-screen bg-[linear-gradient(180deg,#f8fafc_0%,#eef2ff_40%,#ffffff_100%)] dark:bg-gray-950">
        <section className="mx-auto max-w-7xl px-4 py-10 lg:px-8">
          <div className="rounded-2xl border border-gray-200 bg-white/90 p-4 shadow-sm backdrop-blur dark:border-gray-800 dark:bg-gray-950/90 md:p-6">
            <div className="grid gap-4 md:grid-cols-4">
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
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-gray-500 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-100"
                >
                  {categories.map((item) => (
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
                  onChange={(e) => setSortBy(e.target.value)}
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
            <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="animate-pulse rounded-2xl border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-900">
                  <div className="h-64 rounded-xl bg-gray-200 dark:bg-gray-800"></div>
                  <div className="mt-4 h-4 w-3/4 rounded bg-gray-200 dark:bg-gray-800"></div>
                  <div className="mt-2 h-4 w-1/2 rounded bg-gray-200 dark:bg-gray-800"></div>
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
              <p className="text-lg font-medium text-gray-700 dark:text-gray-200">No products found for this filter.</p>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Try changing category, sorting, or your search term.</p>
            </div>
          )}

          {!loading && !error && filteredProducts.length > 0 && (
            <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredProducts.map((product, idx) => (
                <article
                  key={product.id}
                  className="group animate-card-in overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition hover:shadow-lg dark:border-gray-800 dark:bg-gray-900"
                  style={{ animationDelay: `${(idx % 8) * 50}ms` }}
                  onClick={() => product.stock_count > 0 && openQuickAdd(product)}
                >
                  <div className="relative">
                    {product.image_url ? (
                      <img src={product.image_url} alt={product.name} className="h-72 w-full object-cover object-top transition duration-300 group-hover:scale-105" />
                    ) : (
                      <div className="flex h-72 w-full items-center justify-center bg-gray-100 dark:bg-gray-800">
                        <i className="ri-image-line text-4xl text-gray-400"></i>
                      </div>
                    )}
                    {product.on_sale && (
                      <span className="absolute left-3 top-3 rounded-full bg-red-600 px-3 py-1 text-xs font-semibold text-white">Sale</span>
                    )}
                    {product.is_new && (
                      <span className="absolute right-3 top-3 rounded-full bg-emerald-600 px-3 py-1 text-xs font-semibold text-white">New</span>
                    )}
                  </div>

                  <div className="p-4">
                    <h3 className="line-clamp-1 text-base font-semibold text-gray-900 dark:text-gray-100">{product.name}</h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{product.brand || 'Excito'} • {product.section || 'All'}</p>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {(product.colors || []).slice(0, 5).map((color, index) => (
                        <span
                          key={`${product.id}-${color}-${index}`}
                          className={`h-5 w-5 rounded-full ${COLOR_MAP[color] || 'bg-gray-300'}`}
                          title={color}
                        ></span>
                      ))}
                    </div>

                    <div className="mt-4 flex items-center gap-2">
                      <span className="text-lg font-bold text-gray-900 dark:text-gray-100">Rs {Number(product.price).toLocaleString()}</span>
                      {product.original_price && (
                        <span className="text-sm text-gray-500 line-through dark:text-gray-400">Rs {Number(product.original_price).toLocaleString()}</span>
                      )}
                    </div>

                    <button
                      onClick={() => openQuickAdd(product)}
                      disabled={product.stock_count <= 0}
                      className="mt-4 w-full rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-300 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200 dark:disabled:bg-gray-700"
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
