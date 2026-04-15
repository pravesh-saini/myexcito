'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

const HERO_IMAGES = [
  'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=2200&q=85',
  'https://images.unsplash.com/photo-1549060279-7e168fcee0c2?auto=format&fit=crop&w=2200&q=85',
  'https://images.unsplash.com/photo-1518459031867-a89b944bffe4?auto=format&fit=crop&w=2200&q=85',
];

export default function HeroSection() {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % HERO_IMAGES.length);
    }, 9000);

    return () => window.clearInterval(intervalId);
  }, []);

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden scroll-smooth">
      {HERO_IMAGES.map((image, index) => (
        <div
          key={image}
          className={`absolute inset-0 bg-cover bg-center bg-no-repeat transition-opacity duration-1000 ease-in-out ${
            index === currentImageIndex ? 'opacity-100' : 'opacity-0'
          }`}
          style={{ backgroundImage: `url('${image}')` }}
        ></div>
      ))}
      <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/45 to-black/70 transition-colors duration-1000"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(244,63,94,0.3),transparent_40%),radial-gradient(circle_at_bottom_left,rgba(6,182,212,0.25),transparent_45%)]"></div>
      
      <div className="relative z-10 px-4 lg:px-8 w-full">
        <div className="max-w-6xl mx-auto">
          <div className="text-white animate-slide-up">
            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
              Just Do It
            </h1>
            <p className="text-xl md:text-2xl mb-8 max-w-2xl opacity-95 smooth-opacity">
              Discover the latest in athletic wear designed for champions. 
              Unleash your potential with Excito's premium collection.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/shop" className="bg-rose-500 text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-rose-600 transition-all duration-300 cursor-pointer whitespace-nowrap hover:shadow-lg hover:shadow-rose-500/50 transform hover:scale-105">
                Shop Now
              </Link>
              <Link href="/collections" className="border-2 border-white text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-white hover:text-black transition-all duration-300 cursor-pointer whitespace-nowrap hover:shadow-lg">
                View Collections
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}