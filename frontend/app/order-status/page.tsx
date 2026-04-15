import Link from 'next/link';

export default function OrderStatusPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-950 dark:to-gray-950 px-4 py-12">
      <div className="max-w-4xl mx-auto ui-card p-8">
        <h1 className="text-3xl font-black text-gray-900 dark:text-gray-100">Order Status</h1>
        <p className="mt-3 text-gray-600 dark:text-gray-400">Track your latest order updates from your account.</p>
        <Link href="/orders" className="ui-btn-primary inline-block mt-6">Go To My Orders</Link>
      </div>
    </main>
  );
}
