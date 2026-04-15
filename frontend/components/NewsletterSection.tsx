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
    <section className="py-16 px-4 lg:px-8 bg-black text-white smooth-transitions">
      <div className="max-w-4xl mx-auto text-center animate-section-in">
        <h2 className="text-4xl md:text-5xl font-bold mb-4">Stay in the Game</h2>
        <p className="text-xl text-gray-300 mb-8 smooth-opacity">
          Get the latest updates on new releases, exclusive offers, and athletic inspiration
        </p>
        
        <form onSubmit={handleSubmit} className="max-w-md mx-auto">
          <div className="flex flex-col sm:flex-row gap-4 smooth-transitions">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="flex-1 px-6 py-4 bg-gray-800 text-white rounded-full border-none outline-none text-lg smooth-transitions hover:bg-gray-700 focus:bg-gray-700 focus:ring-2 focus:ring-white/30"
              required
            />
            <button
              type="submit"
              className="bg-white text-black px-8 py-4 rounded-full font-bold text-lg hover:bg-gray-200 smooth-transitions cursor-pointer whitespace-nowrap hover:shadow-lg hover:shadow-white/20 active:scale-95"
            >
              Subscribe
            </button>
          </div>
        </form>
        
        {isSubscribed && (
          <div className="mt-4 text-green-400 font-medium animate-scale-in">
            ✓ Thanks for subscribing! You'll receive updates soon.
          </div>
        )}
        
        <p className="text-sm text-gray-400 mt-6 opacity-80 smooth-opacity">
          By subscribing, you agree to receive marketing emails from Excito. You can unsubscribe at any time.
        </p>
      </div>
    </section>
  );
}