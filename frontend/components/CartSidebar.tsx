'use client';

import { useCart } from '@/context/CartContext';
import Link from 'next/link';

export default function CartSidebar({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const { items, removeItem, clearCart, totalItems } = useCart();

  const subtotal = items.reduce(
    (sum, item) => sum + Number(item.product.price) * item.quantity,
    0
  );

  return (
    <div
      className={`fixed inset-0 z-50 ${isOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}
      aria-hidden={!isOpen}
    >
      <div
        className={`absolute inset-0 bg-black/40 backdrop-blur-[2px] transition-opacity ${
          isOpen ? 'opacity-100 animate-fade-in' : 'opacity-0'
        }`}
        onClick={onClose}
      />

      <div
        role="dialog"
        aria-label="Shopping cart"
        className={`absolute top-0 right-0 h-full w-[92vw] max-w-[380px] sm:w-[380px] bg-white dark:bg-gray-950 shadow-2xl transform transition-transform duration-300 border-l border-gray-200/60 dark:border-gray-800 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`p-5 sm:p-6 flex flex-col h-full ${isOpen ? 'animate-slide-in-right' : ''}`}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Your Cart</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{totalItems} item{totalItems === 1 ? '' : 's'}</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors"
              aria-label="Close cart"
            >
              <i className="ri-close-line text-xl text-gray-700 dark:text-gray-200" />
            </button>
          </div>

          <div className="mt-5 flex-1 overflow-y-auto pr-1">
            {items.length === 0 ? (
              <div className="text-center py-10">
                <i className="ri-shopping-cart-line text-3xl text-gray-300 mb-2 block" />
                <p className="text-gray-600 dark:text-gray-200 font-medium">Your cart is empty</p>
                <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">Add items to checkout faster.</p>
              </div>
            ) : (
              items.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-3 mb-4 animate-card-in"
                  style={{ animationDelay: `${Math.min(idx, 12) * 45}ms` }}
                >
                  {item.product.image_url ? (
                    <img
                      src={item.product.image_url}
                      alt={item.product.name}
                      className="w-16 h-16 object-cover rounded-xl"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
                      <i className="ri-image-line text-xl text-gray-300" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{item.product.name}</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                      {item.size ? `Size: ${item.size}` : 'Size: —'} · {item.color ? `Color: ${item.color}` : 'Color: —'}
                    </p>
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-sm font-bold text-gray-900 dark:text-gray-100">₹{Number(item.product.price).toLocaleString()}</p>
                      <button
                        onClick={() => removeItem(idx)}
                        className="text-sm text-red-600 hover:text-red-700 font-semibold"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {items.length > 0 && (
            <div className="pt-4 border-t border-gray-200 dark:border-gray-800">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-300">Subtotal</span>
                <span className="font-bold text-gray-900 dark:text-gray-100">₹{subtotal.toLocaleString()}</span>
              </div>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Shipping & taxes calculated at checkout.</p>
              <Link href="/checkout" onClick={onClose} className="mt-4 ui-btn-primary w-full">
                Checkout
              </Link>
              <button onClick={clearCart} className="mt-2 ui-btn-secondary w-full text-red-600">
                Clear Cart
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
