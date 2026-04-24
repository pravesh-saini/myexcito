'use client';

import Link from 'next/link';
import { fetchOrders } from '@/lib/api';
import { useEffect, useState } from 'react';

interface OrderItemSnapshot {
  product: number;
  product_name: string;
  product_image_url: string;
  price: number;
  quantity: number;
  size?: string;
  color?: string;
}

interface OrderSnapshot {
  id: number | string;
  createdAt: string;
  totalAmount: number;
  paymentMode: string;
  itemCount: number;
  status: string;
  items: OrderItemSnapshot[];
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
          items: o.items.map(i => ({
            ...i,
            price: parseFloat(i.price)
          }))
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

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'delivered': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'shipped': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      case 'cancelled': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-950 dark:to-gray-950 px-4 py-12 sm:py-16">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
          <div>
            <h1 className="text-4xl font-black text-gray-900 dark:text-gray-100 tracking-tight">My Orders</h1>
            <p className="mt-1 text-gray-500 dark:text-gray-400">Manage and track your recent purchases</p>
          </div>
          <Link href="/shop" className="ui-btn-secondary inline-flex items-center gap-2">
            <i className="ri-shopping-bag-line"></i>
            Continue Shopping
          </Link>
        </div>

        {loading ? (
          <div className="space-y-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="ui-card p-6 animate-pulse">
                <div className="flex justify-between mb-4">
                  <div className="h-4 w-32 bg-gray-200 dark:bg-gray-800 rounded shape"></div>
                  <div className="h-6 w-20 bg-gray-200 dark:bg-gray-800 rounded-full"></div>
                </div>
                <div className="flex gap-4">
                  <div className="h-20 w-20 bg-gray-200 dark:bg-gray-800 rounded-lg"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-3/4 bg-gray-200 dark:bg-gray-800 rounded"></div>
                    <div className="h-3 w-1/2 bg-gray-200 dark:bg-gray-800 rounded"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="ui-card p-12 text-center border-red-100 dark:border-red-900/30 max-w-lg mx-auto">
            <div className="w-16 h-16 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <i className="ri-error-warning-line text-3xl text-red-500"></i>
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">Authentication Error</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-8">{error}</p>
            <Link href="/login" className="ui-btn-primary w-full inline-block">
              Go to Login
            </Link>
          </div>
        ) : orders.length === 0 ? (
          <div className="ui-card p-16 text-center max-w-lg mx-auto">
            <div className="w-20 h-20 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
              <i className="ri-file-list-3-line text-4xl text-gray-300"></i>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">No orders found</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-8">
              Looks like you haven't placed any orders yet. Start shopping to fill this up!
            </p>
            <Link href="/shop" className="ui-btn-primary">
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="space-y-8">
            {orders.map((order) => (
              <article key={`${order.id}-${order.createdAt}`} className="ui-card overflow-hidden group hover:border-gray-300 dark:hover:border-gray-700 transition-all duration-300 shadow-sm hover:shadow-md">
                {/* Order Header */}
                <div className="bg-gray-50/50 dark:bg-gray-800/30 px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 flex-1">
                    <div>
                      <p className="text-[10px] uppercase tracking-wider font-bold text-gray-400">Order ID</p>
                      <p className="text-sm font-mono font-bold text-gray-900 dark:text-gray-100 truncate">#{order.id}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wider font-bold text-gray-400">Date Placed</p>
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wider font-bold text-gray-400">Total</p>
                      <p className="text-sm font-bold text-gray-900 dark:text-gray-100">₹{order.totalAmount.toLocaleString()}</p>
                    </div>
                    <div className="hidden sm:block">
                      <p className="text-[10px] uppercase tracking-wider font-bold text-gray-400">Payment</p>
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 uppercase">{order.paymentMode}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between lg:justify-end gap-3 mt-2 lg:mt-0">
                    <span className="sm:hidden text-[10px] uppercase tracking-wider font-bold text-gray-400">Status</span>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${getStatusColor(order.status)}`}>
                      {order.status || 'Pending'}
                    </span>
                  </div>
                </div>

                {/* Order Items */}
                <div className="p-6">
                  <div className="space-y-6">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex gap-4 sm:gap-6 items-start group/item">
                        <div className="relative w-20 h-24 sm:w-24 sm:h-28 bg-gray-100 dark:bg-gray-800 rounded-xl overflow-hidden flex-shrink-0 border border-gray-100 dark:border-gray-800">
                          {item.product_image_url ? (
                            <img 
                              src={item.product_image_url} 
                              alt={item.product_name} 
                              className="w-full h-full object-cover group-hover/item:scale-110 transition-transform duration-500"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <i className="ri-image-line text-2xl text-gray-300"></i>
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0 py-1">
                          <h3 className="text-sm sm:text-base font-bold text-gray-900 dark:text-gray-100 line-clamp-1 mb-1">
                            {item.product_name}
                          </h3>
                          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 flex flex-wrap gap-x-3 gap-y-1">
                            {item.size && (
                              <span className="inline-flex items-center gap-1">
                                <span className="font-bold text-gray-400">Size:</span> {item.size}
                              </span>
                            )}
                            {item.color && (
                              <span className="inline-flex items-center gap-1">
                                <span className="font-bold text-gray-400">Color:</span> {item.color}
                              </span>
                            )}
                            <span className="inline-flex items-center gap-1">
                              <span className="font-bold text-gray-400">Qty:</span> {item.quantity}
                            </span>
                          </p>
                          <p className="mt-3 text-sm sm:text-base font-black text-gray-900 dark:text-gray-100">
                            ₹{item.price.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Card Footer Actions */}
                <div className="px-6 py-4 bg-gray-50/30 dark:bg-gray-900/30 border-t border-gray-100 dark:border-gray-800 flex justify-end gap-3">
                  <button className="text-xs font-bold text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                    View Details
                  </button>
                  <button className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline">
                    Reorder Items
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
