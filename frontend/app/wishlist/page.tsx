'use client';

import Link from 'next/link';
import { useWishlist } from '@/context/WishlistContext';
import { useCart } from '@/context/CartContext';
import { Product } from '@/lib/api';

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

export default function WishlistPage() {
  const { items, loading, removeWishlistItem } = useWishlist();
  const { addItem } = useCart();

  const handleAddToCart = (product: Product) => {
    addItem(product, product.sizes?.[0] || '', product.colors?.[0] || '');
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-950 dark:to-gray-950 px-4 py-10">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-black text-gray-900 dark:text-gray-100 mb-8">My Wishlist</h1>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-gray-200 dark:bg-gray-800 rounded-lg h-64 mb-3"></div>
                <div className="bg-gray-200 dark:bg-gray-800 h-4 rounded w-3/4 mb-2"></div>
                <div className="bg-gray-200 dark:bg-gray-800 h-4 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="ui-card p-12 text-center">
            <i className="ri-heart-3-line text-6xl text-gray-300 dark:text-gray-700 mb-4 inline-block"></i>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Your wishlist is empty</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              Save your favorite items here to review or purchase them later.
            </p>
            <Link href="/shop" className="ui-btn-primary inline-flex items-center gap-2">
              <i className="ri-shopping-bag-line"></i>
              Browse Products
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {items.map((item) => {
              const product = item.product;
              if (!product) return null;
              
              return (
                <div key={item.id} className="group relative bg-white dark:bg-gray-900 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                  <div className="relative aspect-[4/5] bg-gray-100 dark:bg-gray-800 overflow-hidden">
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <i className="ri-image-line text-4xl text-gray-300"></i>
                      </div>
                    )}
                    
                    <button
                      onClick={() => removeWishlistItem(item.product_id)}
                      className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-full text-red-500 hover:bg-red-50 dark:hover:bg-red-950/50 transition-colors shadow-sm"
                      title="Remove from wishlist"
                    >
                      <i className="ri-close-line text-lg"></i>
                    </button>

                    {product.on_sale && !product.is_new && (
                      <span className="absolute top-3 left-3 bg-red-500 text-white px-2 py-1 rounded text-xs font-bold">
                        SALE
                      </span>
                    )}
                  </div>
                  
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1 line-clamp-1">
                      {product.name}
                    </h3>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="font-bold text-gray-900 dark:text-gray-100">
                        ₹{Number(product.price).toLocaleString()}
                      </span>
                      {product.original_price && (
                        <span className="text-sm text-gray-500 line-through">
                          ₹{Number(product.original_price).toLocaleString()}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAddToCart(product)}
                        disabled={product.stock_count === 0}
                        className="flex-1 bg-black dark:bg-white text-white dark:text-black py-2 rounded-lg font-medium hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <i className="ri-shopping-cart-2-line"></i>
                        {product.stock_count > 0 ? 'Add to Cart' : 'Out of Stock'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
