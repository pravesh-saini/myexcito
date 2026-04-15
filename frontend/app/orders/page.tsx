'use client';

import Link from 'next/link';
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

  useEffect(() => {
    const rawUser = localStorage.getItem('excito_user');
    if (!rawUser) return;

    try {
      const user = JSON.parse(rawUser);
      const rawOrders = localStorage.getItem(`excito_orders_${String(user.email || '').toLowerCase()}`);
      if (!rawOrders) return;
      const parsed = JSON.parse(rawOrders) as OrderSnapshot[];
      setOrders(parsed);
    } catch {
      setOrders([]);
    }
  }, []);

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-950 dark:to-gray-950 px-4 py-10">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between gap-3 mb-6">
          <h1 className="text-3xl font-black text-gray-900 dark:text-gray-100">My Orders</h1>
          <Link href="/shop" className="ui-btn-secondary">Continue Shopping</Link>
        </div>

        {orders.length === 0 ? (
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
