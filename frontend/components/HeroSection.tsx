'use client';

import Link from 'next/link';

export default function HeroSection() {
  return (
    <section 
      className="relative bg-cover bg-center bg-no-repeat min-h-screen flex items-center"
      style={{
        backgroundImage: `url('https://readdy.ai/api/search-image?query=Athletic%20person%20wearing%20modern%20stylish%20sportswear%20running%20in%20urban%20environment%20with%20clean%20minimalist%20background%20and%20modern%20architecture%20setting%20perfect%20lighting%20professional%20photography%20style%20with%20gradient%20overlay%20and%20dynamic%20movement%20showcasing%20premium%20athletic%20clothing%20brand%20aesthetic&width=1920&height=1080&seq=hero-main&orientation=landscape')`
      }}
    >
      <div className="absolute inset-0 bg-black/40"></div>
      
      <div className="relative z-10 px-4 lg:px-8 w-full">
        <div className="max-w-6xl mx-auto">
          <div className="text-white">
            <h1 className="text-5xl md:text-7xl font-bold mb-6">
              Just Do It
            </h1>
            <p className="text-xl md:text-2xl mb-8 max-w-2xl">
              Discover the latest in athletic wear designed for champions. 
              Unleash your potential with Excito's premium collection.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/shop" className="bg-white text-black px-8 py-4 rounded-full font-bold text-lg hover:bg-gray-200 transition-colors cursor-pointer whitespace-nowrap">
                Shop Now
              </Link>
              <Link href="/collections" className="border-2 border-white text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-white hover:text-black transition-colors cursor-pointer whitespace-nowrap">
                View Collections
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}