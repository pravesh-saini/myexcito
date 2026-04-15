'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { createOrder, fetchShippingConfig, validateCoupon } from '@/lib/api';
import { getColorImageUrl } from '@/lib/productImages';

type PaymentMode = '' | 'cod' | 'upi' | 'card';

export default function CheckoutPage() {
  const { items, totalItems, clearCart } = useCart();
  const router = useRouter();

  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    payment_mode: '' as PaymentMode,
    coupon_code: '',
    address_line1: '',
    address_line2: '',
    city: '',
    state: '',
    postal_code: '',
    country: '',
  });

  const [error, setError] = useState('');
  const [couponInfo, setCouponInfo] = useState('');
  const [flatShippingFee, setFlatShippingFee] = useState(79);
  const [freeShippingThreshold, setFreeShippingThreshold] = useState(999);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const subtotal = items.reduce((sum, item) => sum + Number(item.product.price) * item.quantity, 0);
  const shippingFee = subtotal >= freeShippingThreshold ? 0 : flatShippingFee;
  const totalPayable = Math.max(0, subtotal + shippingFee - discountAmount);

  const paymentLabel: Record<Exclude<PaymentMode, ''>, string> = {
    cod: 'Cash on Delivery (COD)',
    upi: 'UPI',
    card: 'Card',
  };

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

  const handleApplyCoupon = async () => {
    setError('');
    setCouponInfo('');

    if (!form.coupon_code.trim()) {
      setDiscountAmount(0);
      return;
    }

    if (!form.email.trim()) {
      setError('Enter email first to validate coupon.');
      return;
    }

    try {
      const result = await validateCoupon({
        code: form.coupon_code,
        email: form.email,
        subtotal,
      });

      const amount = Number(result.discount_amount);
      setDiscountAmount(amount);
      setCouponInfo(`Coupon applied: ${result.code} (${result.discount_percent}% off)`);
    } catch (err: unknown) {
      setDiscountAmount(0);
      setCouponInfo('');
      setError(err instanceof Error ? err.message : 'Failed to apply coupon');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (items.length === 0) return;
    if (isSubmitting) return;

    if (!form.payment_mode) {
      setError('Please select a payment mode.');
      return;
    }

    try {
      setIsSubmitting(true);
      const createdOrder = await createOrder({
        ...form,
        payment_mode: form.payment_mode,
        items: items.map((item) => ({
          product: item.product.id,
          quantity: item.quantity,
          size: item.size,
          color: item.color,
        })),
      });

      const userKey = `excito_orders_${form.email.toLowerCase()}`;
      const existingOrdersRaw = localStorage.getItem(userKey);
      const existingOrders = existingOrdersRaw ? JSON.parse(existingOrdersRaw) : [];
      const snapshot = {
        id: createdOrder?.id ?? `local-${Date.now()}`,
        createdAt: new Date().toISOString(),
        totalAmount: Number(createdOrder?.total_amount ?? totalPayable),
        paymentMode: form.payment_mode,
        itemCount: items.length,
        status: String(createdOrder?.status || 'pending'),
      };
      localStorage.setItem(userKey, JSON.stringify([snapshot, ...existingOrders].slice(0, 25)));

      clearCart();
      router.push('/');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create order');
    } finally {
      setIsSubmitting(false);
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
            {totalItems} item{totalItems === 1 ? '' : 's'} · Subtotal ₹{subtotal.toLocaleString()} · Shipping{' '}
            {shippingFee === 0 ? 'Free' : `₹${shippingFee.toLocaleString()}`}
          </p>
        </div>

        {couponInfo && (
          <div
            className="mt-4 px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm animate-section-in"
            style={{ animationDelay: '70ms' }}
          >
            {couponInfo}
          </div>
        )}

        {error && (
          <div
            className="mt-5 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm animate-section-in"
            style={{ animationDelay: '60ms' }}
          >
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
                    onChange={(e) => setForm({ ...form, first_name: e.target.value })}
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
                    onChange={(e) => setForm({ ...form, last_name: e.target.value })}
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
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
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
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
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
                    required
                    value={form.payment_mode}
                    onChange={(e) => setForm({ ...form, payment_mode: e.target.value as PaymentMode })}
                    className="ui-select"
                  >
                    <option value="">Select payment mode</option>
                    <option value="cod">Cash on Delivery (COD)</option>
                    <option value="upi">UPI</option>
                    <option value="card">Card</option>
                  </select>
                </div>
              </div>

              <div className="pt-2">
                <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Coupon</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Apply voucher/coupon code if available.</p>
              </div>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={form.coupon_code}
                  onChange={(e) => setForm({ ...form, coupon_code: e.target.value.toUpperCase() })}
                  className="ui-input"
                  placeholder="Enter coupon code"
                />
                <button type="button" onClick={handleApplyCoupon} className="ui-btn-secondary whitespace-nowrap px-4">
                  Apply
                </button>
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
                  onChange={(e) => setForm({ ...form, address_line1: e.target.value })}
                  className="ui-input"
                  placeholder="Street address"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Address line 2 (optional)</label>
                <input
                  type="text"
                  value={form.address_line2}
                  onChange={(e) => setForm({ ...form, address_line2: e.target.value })}
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
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
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
                    onChange={(e) => setForm({ ...form, state: e.target.value })}
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
                    onChange={(e) => setForm({ ...form, postal_code: e.target.value })}
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
                    onChange={(e) => setForm({ ...form, country: e.target.value })}
                    className="ui-input"
                    placeholder="Country"
                  />
                </div>
              </div>

              <button type="submit" disabled={isSubmitting} className="ui-btn-primary w-full disabled:opacity-60 disabled:cursor-not-allowed">
                {isSubmitting ? 'Placing Order...' : 'Place Order'}
              </button>
            </form>
          </div>

          <div className="lg:col-span-1">
            <div className="ui-card p-6 sm:p-7 lg:sticky lg:top-24 animate-section-in" style={{ animationDelay: '100ms' }}>
              <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Order Summary</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Payment: {form.payment_mode ? paymentLabel[form.payment_mode as Exclude<PaymentMode, ''>] : 'Not selected'}
              </p>

              <div className="mt-5 space-y-4">
                {items.map((item, idx) => {
                  const itemImageUrl = getColorImageUrl(item.product, item.color);
                  return (
                    <div key={idx} className="flex items-center gap-3">
                      {itemImageUrl ? (
                        <img src={itemImageUrl} alt={item.product.name} className="w-12 h-12 rounded-xl object-cover" />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                          <i className="ri-image-line text-lg text-gray-300" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{item.product.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                          Qty {item.quantity} · {item.size ? `Size ${item.size}` : 'Size -'} · {item.color ? item.color : 'Color -'}
                        </p>
                      </div>
                      <p className="text-sm font-bold text-gray-900 dark:text-gray-100">₹{Number(item.product.price).toLocaleString()}</p>
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-800">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Subtotal</span>
                  <span className="font-bold text-gray-900 dark:text-gray-100">₹{subtotal.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between text-sm mt-2">
                  <span className="text-gray-600 dark:text-gray-400">Shipping Fee</span>
                  {shippingFee === 0 ? (
                    <span className="font-semibold text-emerald-600">Free</span>
                  ) : (
                    <span className="font-semibold text-gray-900 dark:text-gray-100">₹{shippingFee.toLocaleString()}</span>
                  )}
                </div>
                <div className="flex items-center justify-between text-sm mt-2">
                  <span className="text-gray-600 dark:text-gray-400">Discount</span>
                  <span className="font-semibold text-gray-900 dark:text-gray-100">-₹{discountAmount.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between text-base mt-4">
                  <span className="font-bold text-gray-900 dark:text-gray-100">Total Payable</span>
                  <span className="font-black text-gray-900 dark:text-gray-100">₹{totalPayable.toLocaleString()}</span>
                </div>
                {shippingFee > 0 && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    Add ₹{Math.max(0, freeShippingThreshold - subtotal).toLocaleString()} more for free shipping.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
