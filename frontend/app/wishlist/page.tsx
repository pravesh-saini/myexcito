'use client';

import Link from 'next/link';

export default function WishlistPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-950 dark:to-gray-950 px-4 py-10">
      <div className="max-w-5xl mx-auto ui-card p-8 text-center">
        <i className="ri-heart-3-line text-4xl text-gray-300"></i>
        <h1 className="mt-3 text-3xl font-black text-gray-900 dark:text-gray-100">Wishlist</h1>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Wishlist page is ready. Next step can be connecting the heart icon to persist favorite products here.
        </p>
        <div className="mt-5 flex justify-center gap-3">
          <Link href="/shop" className="ui-btn-primary">Browse Products</Link>
          <Link href="/" className="ui-btn-secondary">Go Home</Link>
        </div>
      </div>
    </main>
  );
}
