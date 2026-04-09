
'use client';

import { useState, useEffect } from 'react';
import { fetchProducts, Product } from '@/lib/api';
import { useCart } from '@/context/CartContext';

interface ProductGridProps {
  selectedCategory: string;
  selectedBrand: string;
  sortBy: string;
  priceRange: number[];
}

const COLOR_MAP: Record<string, string> = {
  black: 'bg-black', white: 'bg-white border border-gray-300', gray: 'bg-gray-400',
  navy: 'bg-blue-900', blue: 'bg-blue-500', red: 'bg-red-500', green: 'bg-green-500',
  purple: 'bg-purple-500', teal: 'bg-teal-500', pink: 'bg-pink-400',
  olive: 'bg-green-600', multicolor: 'bg-gradient-to-r from-red-400 via-yellow-400 to-blue-400',
};

export default function ProductGrid({ selectedCategory, selectedBrand, sortBy, priceRange }: ProductGridProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [favorites, setFavorites] = useState<number[]>([]);
  const [quickAdd, setQuickAdd] = useState<{ product: Product; size: string; color: string } | null>(null);
  const { addItem } = useCart();

  useEffect(() => {
    setLoading(true);
    fetchProducts({ category: 'men' })
      .then(setProducts)
      .catch(() => setError('Could not load products. Is the Django backend running?'))
      .finally(() => setLoading(false));
  }, []);

  const toggleFavorite = (id: number) =>
    setFavorites(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const handleAddToCart = (product: Product) => {
    setQuickAdd({ product, size: product.sizes[0] || '', color: product.colors[0] || '' });
  };

  const confirmAddToCart = () => {
    if (!quickAdd) return;
    addItem(quickAdd.product, quickAdd.size, quickAdd.color);
    setQuickAdd(null);
  };

  const filteredProducts = products.filter(p => {
    const catMatch = selectedCategory === 'all' || p.section === selectedCategory;
    const brandMatch = selectedBrand === 'all' || p.brand === selectedBrand;
    const priceMatch = p.price >= priceRange[0] && p.price <= priceRange[1];
    return catMatch && brandMatch && priceMatch;
  });

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (sortBy) {
      case 'price-low': return a.price - b.price;
      case 'price-high': return b.price - a.price;
      case 'newest': return (b.is_new ? 1 : 0) - (a.is_new ? 1 : 0);
      default: return 0;
    }
  });

  if (loading) return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {[...Array(8)].map((_, i) => (
        <div key={i} className="animate-pulse">
          <div className="bg-gray-200 rounded-lg h-80 mb-3"></div>
          <div className="bg-gray-200 h-4 rounded w-3/4 mb-2"></div>
          <div className="bg-gray-200 h-4 rounded w-1/2"></div>
        </div>
      ))}
    </div>
  );

  if (error) return (
    <div className="col-span-4 text-center py-16">
      <i className="ri-error-warning-line text-4xl text-red-400 mb-3 block"></i>
      <p className="text-red-500 font-medium">{error}</p>
      <p className="text-gray-400 text-sm mt-1">Make sure Django is running on port 8000</p>
    </div>
  );

  if (products.length === 0) return (
    <div className="col-span-4 text-center py-16 text-gray-400">
      <i className="ri-store-2-line text-4xl mb-3 block"></i>
      <p className="font-medium">No products yet</p>
      <p className="text-sm mt-1">Add products from the admin panel to see them here.</p>
    </div>
  );

  if (sortedProducts.length === 0) return (
    <div className="col-span-4 text-center py-16 text-gray-400">
      <i className="ri-search-line text-4xl mb-3 block"></i>
      <p className="font-medium">No products match your filters</p>
    </div>
  );

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {sortedProducts.map((product, index) => (
          <div
            key={product.id}
            className="group cursor-pointer animate-card-in"
            style={{ animationDelay: `${Math.min(index, 12) * 45}ms` }}
          >
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
              <button onClick={() => toggleFavorite(product.id)}
                className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center bg-white dark:bg-gray-950 rounded-full shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                <i className={favorites.includes(product.id) ? 'ri-heart-fill text-red-500' : 'ri-heart-line text-gray-600 dark:text-gray-300'}></i>
              </button>
              {product.is_new && <span className="absolute top-3 left-3 bg-green-500 text-white px-2 py-1 rounded text-xs font-medium">New</span>}
              {product.on_sale && !product.is_new && <span className="absolute top-3 left-3 bg-red-500 text-white px-2 py-1 rounded text-xs font-medium">Sale</span>}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="flex gap-2 mb-2">
                  {product.colors.map((color, i) => (
                    <div key={i} className={"w-6 h-6 rounded-full border-2 border-white " + (COLOR_MAP[color] || 'bg-gray-300')}></div>
                  ))}
                </div>
                <button onClick={() => handleAddToCart(product)}
                  className="w-full bg-white text-black py-2 rounded font-medium hover:bg-gray-100 transition-colors whitespace-nowrap cursor-pointer">
                  Add to Cart
                </button>
              </div>
            </div>
            <div className="mt-4">
              <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-1">{product.name}</h3>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-gray-900 dark:text-gray-100">&#8377;{Number(product.price).toLocaleString()}</span>
                {product.original_price && <span className="text-sm text-gray-500 dark:text-gray-400 line-through">&#8377;{Number(product.original_price).toLocaleString()}</span>}
              </div>
            </div>
          </div>
        ))}
      </div>
      {quickAdd && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-950 rounded-2xl shadow-xl p-6 max-w-sm w-full animate-section-in border border-gray-100 dark:border-gray-800">
            <div className="flex justify-between items-start mb-4">
              <h3 className="font-bold text-gray-900 dark:text-gray-100">{quickAdd.product.name}</h3>
              <button onClick={() => setQuickAdd(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer"><i className="ri-close-line text-xl"></i></button>
            </div>
            <div className="mb-4">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Select Size</p>
              <div className="flex flex-wrap gap-2">
                {quickAdd.product.sizes.map(s => (
                  <button key={s} onClick={() => setQuickAdd(prev => prev ? { ...prev, size: s } : null)}
                    className={"px-3 py-1.5 rounded-lg border text-sm font-medium cursor-pointer transition-colors " + (quickAdd.size === s ? 'bg-black text-white border-black' : 'border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-black dark:hover:border-gray-200')}>{s}</button>
                ))}
              </div>
            </div>
            <div className="mb-6">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Select Color</p>
              <div className="flex flex-wrap gap-2">
                {quickAdd.product.colors.map(c => (
                  <button key={c} onClick={() => setQuickAdd(prev => prev ? { ...prev, color: c } : null)}
                    className={"px-3 py-1.5 rounded-lg border text-sm capitalize cursor-pointer transition-colors " + (quickAdd.color === c ? 'bg-black text-white border-black' : 'border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-black dark:hover:border-gray-200')}>{c}</button>
                ))}
              </div>
            </div>
            <button onClick={confirmAddToCart} className="w-full bg-black text-white py-3 rounded-xl font-medium hover:bg-gray-800 transition-colors cursor-pointer">
              Add to Cart
            </button>
          </div>
        </div>
      )}
    </>
  );
}
