'use client';

import { useState } from 'react';

export default function NewsletterSection() {
  const [email, setEmail] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setIsSubscribed(true);
      setEmail('');
      setTimeout(() => setIsSubscribed(false), 3000);
    }
  };

  return (
    <section className="py-16 px-4 lg:px-8 bg-black text-white">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-4xl md:text-5xl font-bold mb-4">Stay in the Game</h2>
        <p className="text-xl text-gray-300 mb-8">
          Get the latest updates on new releases, exclusive offers, and athletic inspiration
        </p>
        
        <form onSubmit={handleSubmit} className="max-w-md mx-auto">
          <div className="flex flex-col sm:flex-row gap-4">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="flex-1 px-6 py-4 bg-gray-800 text-white rounded-full border-none outline-none text-lg"
              required
            />
            <button
              type="submit"
              className="bg-white text-black px-8 py-4 rounded-full font-bold text-lg hover:bg-gray-200 transition-colors cursor-pointer whitespace-nowrap"
            >
              Subscribe
            </button>
          </div>
        </form>
        
        {isSubscribed && (
          <div className="mt-4 text-green-400 font-medium">
            Thanks for subscribing! You'll receive updates soon.
          </div>
        )}
        
        <p className="text-sm text-gray-400 mt-6">
          By subscribing, you agree to receive marketing emails from Excito. You can unsubscribe at any time.
        </p>
      </div>
    </section>
  );
}