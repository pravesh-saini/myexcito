'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { fetchShippingConfig } from '@/lib/api';
import { getColorImageUrl } from '@/lib/productImages';

export default function CartPage() {
  const { items, updateItemQuantity, removeItem, clearCart, totalItems } = useCart();
  const [flatShippingFee, setFlatShippingFee] = useState(79);
  const [freeShippingThreshold, setFreeShippingThreshold] = useState(999);

  useEffect(() => {
    fetchShippingConfig()
      .then((cfg) => {
        setFlatShippingFee(Number(cfg.flat_shipping_fee));
        setFreeShippingThreshold(Number(cfg.free_shipping_threshold));
      })
      .catch(() => {
        setFlatShippingFee(79);
        setFreeShippingThreshold(999);
      });
  }, []);

  const subtotal = items.reduce((sum, item) => sum + Number(item.product.price) * item.quantity, 0);
  const shippingFee = subtotal >= freeShippingThreshold ? 0 : flatShippingFee;
  const totalPayable = subtotal + shippingFee;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-950 dark:to-gray-950 px-4 py-10">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-gray-900 dark:text-gray-100">Your Cart</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">{totalItems} item{totalItems === 1 ? '' : 's'}</p>

        {items.length === 0 ? (
          <div className="ui-card p-8 text-center mt-6">
            <i className="ri-shopping-cart-line text-4xl text-gray-300 mb-3 block" />
            <p className="text-gray-800 dark:text-gray-100 font-semibold">Your cart is empty</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Add products and then place your order.</p>
            <Link href="/" className="ui-btn-primary inline-block mt-4">Continue Shopping</Link>
          </div>
        ) : (
          <div className="mt-7 grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
            <div className="lg:col-span-2 ui-card p-6 sm:p-8 space-y-4">
              {items.map((item, idx) => {
                const itemImageUrl = getColorImageUrl(item.product, item.color);
                return (
                  <div key={idx} className="flex items-center gap-3 border-b border-gray-100 dark:border-gray-800 pb-4">
                    {itemImageUrl ? (
                      <img src={itemImageUrl} alt={item.product.name} className="w-16 h-16 object-cover rounded-xl" />
                    ) : (
                      <div className="w-16 h-16 rounded-xl bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
                        <i className="ri-image-line text-xl text-gray-300" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{item.product.name}</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                        {item.size ? `Size ${item.size}` : 'Size —'} · {item.color ? item.color : 'Color —'}
                      </p>
                      <div className="mt-2 inline-flex items-center overflow-hidden rounded-lg border border-gray-300 dark:border-gray-700">
                        <button
                          type="button"
                          onClick={() => updateItemQuantity(idx, item.quantity - 1)}
                          className="px-2.5 py-1 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-900"
                          aria-label="Decrease quantity"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          min={1}
                          max={99}
                          value={item.quantity}
                          onChange={(event) => updateItemQuantity(idx, Number(event.target.value || 1))}
                          className="w-12 border-x border-gray-300 bg-transparent px-1 py-1 text-center text-sm text-gray-900 outline-none dark:border-gray-700 dark:text-gray-100"
                        />
                        <button
                          type="button"
                          onClick={() => updateItemQuantity(idx, item.quantity + 1)}
                          className="px-2.5 py-1 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-900"
                          aria-label="Increase quantity"
                        >
                          +
                        </button>
                      </div>
                      <p className="text-sm font-bold text-gray-900 dark:text-gray-100 mt-1">₹{(Number(item.product.price) * item.quantity).toLocaleString()}</p>
                    </div>
                    <button onClick={() => removeItem(idx)} className="text-sm text-red-600 hover:text-red-700 font-semibold">Remove</button>
                  </div>
                );
              })}
            </div>

            <div className="ui-card p-6 sm:p-7 lg:sticky lg:top-24 h-fit">
              <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Summary</h2>
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Subtotal</span>
                  <span className="font-bold text-gray-900 dark:text-gray-100">₹{subtotal.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Shipping Fee</span>
                  {shippingFee === 0 ? (
                    <span className="font-semibold text-emerald-600">Free</span>
                  ) : (
                    <span className="font-semibold text-gray-900 dark:text-gray-100">₹{shippingFee.toLocaleString()}</span>
                  )}
                </div>
                <div className="pt-2 border-t border-gray-200 dark:border-gray-800 flex items-center justify-between text-base">
                  <span className="font-bold text-gray-900 dark:text-gray-100">Total Payable</span>
                  <span className="font-black text-gray-900 dark:text-gray-100">₹{totalPayable.toLocaleString()}</span>
                </div>
                {shippingFee > 0 && (
                  <p className="text-xs text-gray-500 dark:text-gray-400">Add ₹{Math.max(0, freeShippingThreshold - subtotal).toLocaleString()} more for free shipping.</p>
                )}
              </div>
              <Link href="/checkout" className="ui-btn-primary w-full mt-5">Place Order</Link>
              <button onClick={clearCart} className="ui-btn-secondary w-full mt-2 text-red-600">Clear Cart</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
