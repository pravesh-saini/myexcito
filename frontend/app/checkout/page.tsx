'use client';

import { useState } from 'react';
import { useCart } from '@/context/CartContext';
import { createOrder } from '@/lib/api';
import { useRouter } from 'next/navigation';

type PaymentMode = 'cod' | 'upi' | 'card';

export default function CheckoutPage() {
  const { items, totalItems, clearCart } = useCart();
  const router = useRouter();
  const [form, setForm] = useState<{
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    payment_mode: PaymentMode;
    address_line1: string;
    address_line2: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
  }>({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    payment_mode: 'cod',
    address_line1: '',
    address_line2: '',
    city: '',
    state: '',
    postal_code: '',
    country: '',
  });
  const [error, setError] = useState('');

  const subtotal = items.reduce(
    (sum, item) => sum + Number(item.product.price) * item.quantity,
    0
  );

  const paymentLabel: Record<PaymentMode, string> = {
    cod: 'Cash on Delivery (COD)',
    upi: 'UPI',
    card: 'Card',
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return;
    try {
      await createOrder({ ...form, items: items.map(i => ({
        product: i.product.id,
        quantity: i.quantity,
        size: i.size,
        color: i.color,
      })) });
      clearCart();
      router.push('/');
    } catch (err: any) {
      setError(err.message || 'Failed to create order');
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-950 dark:to-gray-950 px-4 py-14">
        <div className="max-w-2xl mx-auto">
          <div className="ui-card p-8 text-center animate-section-in">
            <i className="ri-shopping-cart-line text-4xl text-gray-300 mb-3 block" />
            <p className="text-gray-800 dark:text-gray-100 font-semibold">Your cart is empty</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Add some products to place an order.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-950 dark:to-gray-950 px-4 py-10">
      <div className="max-w-6xl mx-auto">
        <div className="animate-section-in" style={{ animationDelay: '20ms' }}>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-gray-900 dark:text-gray-100">Checkout</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            {totalItems} item{totalItems === 1 ? '' : 's'} · Subtotal ₹{subtotal.toLocaleString()}
          </p>
        </div>

        {error && (
          <div className="mt-5 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm animate-section-in" style={{ animationDelay: '60ms' }}>
            {error}
          </div>
        )}

        <div className="mt-7 grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="ui-card p-6 sm:p-8 space-y-6 animate-section-in" style={{ animationDelay: '80ms' }}>
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Contact</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">We’ll send order updates to this email.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">First name</label>
                  <input
                    type="text"
                    required
                    value={form.first_name}
                    onChange={e => setForm({ ...form, first_name: e.target.value })}
                    className="ui-input"
                    placeholder="First name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Last name</label>
                  <input
                    type="text"
                    required
                    value={form.last_name}
                    onChange={e => setForm({ ...form, last_name: e.target.value })}
                    className="ui-input"
                    placeholder="Last name"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Email</label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                    className="ui-input"
                    placeholder="you@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Phone</label>
                  <input
                    type="tel"
                    required
                    value={form.phone}
                    onChange={e => setForm({ ...form, phone: e.target.value })}
                    className="ui-input"
                    placeholder="Phone"
                  />
                </div>
              </div>

              <div className="pt-2">
                <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Payment</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Choose your preferred payment mode.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Payment mode</label>
                  <select
                    value={form.payment_mode}
                    onChange={e => setForm({ ...form, payment_mode: e.target.value as PaymentMode })}
                    className="ui-select"
                  >
                    <option value="cod">Cash on Delivery (COD)</option>
                    <option value="upi">UPI</option>
                    <option value="card">Card</option>
                  </select>
                </div>
                <div className="hidden sm:block" />
              </div>

              <div className="pt-2">
                <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Shipping</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Where should we deliver your order?</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Address line 1</label>
                <input
                  type="text"
                  required
                  value={form.address_line1}
                  onChange={e => setForm({ ...form, address_line1: e.target.value })}
                  className="ui-input"
                  placeholder="Street address"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Address line 2 (optional)</label>
                <input
                  type="text"
                  value={form.address_line2}
                  onChange={e => setForm({ ...form, address_line2: e.target.value })}
                  className="ui-input"
                  placeholder="Apartment, suite, etc."
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">City</label>
                  <input
                    type="text"
                    required
                    value={form.city}
                    onChange={e => setForm({ ...form, city: e.target.value })}
                    className="ui-input"
                    placeholder="City"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">State</label>
                  <input
                    type="text"
                    required
                    value={form.state}
                    onChange={e => setForm({ ...form, state: e.target.value })}
                    className="ui-input"
                    placeholder="State"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Postal code</label>
                  <input
                    type="text"
                    required
                    value={form.postal_code}
                    onChange={e => setForm({ ...form, postal_code: e.target.value })}
                    className="ui-input"
                    placeholder="Postal code"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Country</label>
                  <input
                    type="text"
                    required
                    value={form.country}
                    onChange={e => setForm({ ...form, country: e.target.value })}
                    className="ui-input"
                    placeholder="Country"
                  />
                </div>
              </div>

              <button type="submit" className="ui-btn-primary w-full">
                Place Order
              </button>
            </form>
          </div>

          <div className="lg:col-span-1">
            <div className="ui-card p-6 sm:p-7 lg:sticky lg:top-24 animate-section-in" style={{ animationDelay: '100ms' }}>
              <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Order Summary</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Payment: {paymentLabel[form.payment_mode]}</p>

              <div className="mt-5 space-y-4">
                {items.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    {item.product.image_url ? (
                      <img src={item.product.image_url} alt={item.product.name} className="w-12 h-12 rounded-xl object-cover" />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                        <i className="ri-image-line text-lg text-gray-300" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{item.product.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                        Qty {item.quantity} · {item.size ? `Size ${item.size}` : 'Size —'} · {item.color ? item.color : 'Color —'}
                      </p>
                    </div>
                    <p className="text-sm font-bold text-gray-900 dark:text-gray-100">₹{Number(item.product.price).toLocaleString()}</p>
                  </div>
                ))}
              </div>

              <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-800">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Subtotal</span>
                  <span className="font-bold text-gray-900 dark:text-gray-100">₹{subtotal.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between text-sm mt-2">
                  <span className="text-gray-600 dark:text-gray-400">Shipping</span>
                  <span className="font-semibold text-gray-900 dark:text-gray-100">Calculated</span>
                </div>
                <div className="flex items-center justify-between text-base mt-4">
                  <span className="font-bold text-gray-900 dark:text-gray-100">Total</span>
                  <span className="font-black text-gray-900 dark:text-gray-100">₹{subtotal.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}