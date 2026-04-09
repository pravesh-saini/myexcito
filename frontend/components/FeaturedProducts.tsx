
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { fetchProducts, Product } from '@/lib/api';
import { useCart } from '@/context/CartContext';

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
  olive: 'bg-green-600',
  multicolor: 'bg-gradient-to-r from-red-400 via-yellow-400 to-blue-400',
};

const MAX_FEATURED = 12;

export default function FeaturedProducts() {
  const { addItem } = useCart();

  const [favorites, setFavorites] = useState<number[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    setLoading(true);
    setError('');
    fetchProducts()
      .then(setProducts)
      .catch(() => setError('Could not load products. Is the Django backend running?'))
      .finally(() => setLoading(false));
  }, [reloadKey]);

  const toggleFavorite = (productId: number) => {
    setFavorites(prev =>
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const handleAddToCart = (product: Product) => {
    addItem(product, product.sizes?.[0] || '', product.colors?.[0] || '');
  };

  const displayedProducts = products.slice(0, MAX_FEATURED);

  return (
    <section className="py-16 px-4 lg:px-8 bg-white dark:bg-gray-950 animate-section-in">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-12">
          <div>
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900 dark:text-gray-100">Featured Products</h2>
            <p className="text-xl text-gray-600 dark:text-gray-400">Discover our most popular athletic wear</p>
          </div>
          <Link href="/sale" className="bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors cursor-pointer whitespace-nowrap">
            View All
          </Link>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {loading && (
            [...Array(8)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-gray-200 dark:bg-gray-800 rounded-lg h-80 mb-3"></div>
                <div className="bg-gray-200 dark:bg-gray-800 h-4 rounded w-3/4 mb-2"></div>
                <div className="bg-gray-200 dark:bg-gray-800 h-4 rounded w-1/2"></div>
              </div>
            ))
          )}

          {!loading && error && (
            <div className="col-span-4 text-center py-16">
              <i className="ri-error-warning-line text-4xl text-red-400 mb-3 block"></i>
              <p className="text-red-500 font-medium">{error}</p>
              <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">Make sure Django is running on port 8000</p>
              <button
                onClick={() => setReloadKey((n) => n + 1)}
                className="mt-4 px-4 py-2 bg-black text-white rounded-lg text-sm hover:bg-gray-800 transition-colors"
              >
                Retry
              </button>
            </div>
          )}

          {!loading && !error && displayedProducts.length === 0 && (
            <div className="col-span-4 text-center py-16 text-gray-400 dark:text-gray-500">
              <i className="ri-store-2-line text-4xl mb-3 block"></i>
              <p className="font-medium">No products yet</p>
              <p className="text-sm mt-1">Add products from the admin panel to see them here.</p>
            </div>
          )}

          {!loading && !error && displayedProducts.map((product) => (
            <div key={product.id} className="group cursor-pointer animate-card-in" style={{ animationDelay: `${(product.id % 8) * 50}ms` }}>
              <div className="relative overflow-hidden rounded-lg bg-white dark:bg-gray-900 shadow-sm hover:shadow-md transition-shadow">
                {product.image_url ? (
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="w-full h-80 object-cover object-top group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-80 bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                    <i className="ri-image-line text-4xl text-gray-300"></i>
                  </div>
                )}

                <button
                  onClick={() => toggleFavorite(product.id)}
                  className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center bg-white dark:bg-gray-950 rounded-full shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                >
                  <i className={favorites.includes(product.id) ? 'ri-heart-fill text-red-500' : 'ri-heart-line text-gray-600 dark:text-gray-300'}></i>
                </button>

                {product.is_new && (
                  <span className="absolute top-3 left-3 bg-green-500 text-white px-2 py-1 rounded text-xs font-medium">
                    New
                  </span>
                )}

                {product.on_sale && !product.is_new && (
                  <span className="absolute top-3 left-3 bg-red-500 text-white px-2 py-1 rounded text-xs font-medium">
                    Sale
                  </span>
                )}

                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="flex gap-2 mb-2">
                    {product.colors?.map((color, index) => (
                      <div
                        key={index}
                        className={`w-6 h-6 rounded-full border-2 border-white ${COLOR_MAP[color] || 'bg-gray-300'}`}
                      ></div>
                    ))}
                  </div>
                  <button
                    onClick={() => handleAddToCart(product)}
                    className="w-full bg-white text-black py-2 rounded font-medium hover:bg-gray-100 transition-colors whitespace-nowrap cursor-pointer"
                  >
                    Add to Cart
                  </button>
                </div>
              </div>

              <div className="mt-4">
                <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-1">{product.name}</h3>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-gray-900 dark:text-gray-100">₹{Number(product.price).toLocaleString()}</span>
                  {product.original_price && (
                    <span className="text-sm text-gray-500 dark:text-gray-400 line-through">₹{Number(product.original_price).toLocaleString()}</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
