'use client';

import Link from 'next/link';
import { fetchOrders } from '@/lib/api';
import { useEffect, useState } from 'react';

interface OrderSnapshot {
  id: number | string;
  createdAt: string;
  totalAmount: number;
  paymentMode: string;
  itemCount: number;
  status: string;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<OrderSnapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadOrders() {
      try {
        setLoading(true);
        const data = await fetchOrders();
        const mapped = data.map((o) => ({
          id: o.id,
          createdAt: o.created_at,
          totalAmount: parseFloat(o.total_amount),
          paymentMode: o.payment_mode,
          itemCount: o.items.reduce((sum, item) => sum + item.quantity, 0),
          status: o.status,
        }));
        setOrders(mapped);
      } catch (err) {
        console.error('Failed to fetch orders:', err);
        setError('Failed to load orders. Please make sure you are logged in.');
      } finally {
        setLoading(false);
      }
    }

    loadOrders();
  }, []);

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-950 dark:to-gray-950 px-4 py-10">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between gap-3 mb-6">
          <h1 className="text-3xl font-black text-gray-900 dark:text-gray-100">My Orders</h1>
          <Link href="/shop" className="ui-btn-secondary">Continue Shopping</Link>
        </div>

        {loading ? (
          <div className="ui-card p-8 text-center">
            <div className="animate-pulse flex flex-col items-center">
              <div className="h-10 w-10 bg-gray-200 dark:bg-gray-800 rounded-full mb-4"></div>
              <div className="h-4 w-48 bg-gray-200 dark:bg-gray-800 rounded mb-2"></div>
              <div className="h-3 w-32 bg-gray-200 dark:bg-gray-800 rounded"></div>
            </div>
          </div>
        ) : error ? (
          <div className="ui-card p-8 text-center border-red-100 dark:border-red-900/30">
            <i className="ri-error-warning-line text-4xl text-red-500"></i>
            <p className="mt-3 text-gray-900 dark:text-gray-100 font-bold">{error}</p>
            <Link href="/login" className="mt-4 inline-block text-sm font-semibold text-gray-900 dark:text-white underline underline-offset-4 decoration-2">
              Go to Login
            </Link>
          </div>
        ) : orders.length === 0 ? (
          <div className="ui-card p-8 text-center">
            <i className="ri-file-list-line text-4xl text-gray-300"></i>
            <p className="mt-3 text-gray-700 dark:text-gray-200 font-semibold">No orders found yet</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">When you place orders, they will appear here.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <article key={`${order.id}-${order.createdAt}`} className="ui-card p-5">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Order #{order.id}</p>
                    <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mt-1">{order.itemCount} item(s) · Rs {Number(order.totalAmount || 0).toLocaleString()}</h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{new Date(order.createdAt).toLocaleString()} · {order.paymentMode?.toUpperCase() || 'NA'}</p>
                  </div>
                  <span className="inline-flex items-center rounded-full bg-gray-900 text-white dark:bg-white dark:text-gray-900 px-3 py-1 text-xs font-semibold uppercase tracking-wide">
                    {order.status || 'pending'}
                  </span>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
