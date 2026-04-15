
'use client';

import { useState } from 'react';
import FilterSidebar from './FilterSidebar';
import ProductGrid from './ProductGrid';

export default function SalePage() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('featured');
  const [priceRange, setPriceRange] = useState([0, 10000]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-900 via-orange-800 to-yellow-700">
      {/* Products Section */}
      <div className="bg-white dark:bg-gray-950">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 py-12">
          <div className="flex flex-col lg:flex-row gap-8">
            <div className="animate-section-in" style={{ animationDelay: '100ms' }}>
              <FilterSidebar
                selectedCategory={selectedCategory}
                setSelectedCategory={setSelectedCategory}
                priceRange={priceRange}
                setPriceRange={setPriceRange}
              />
            </div>
            
            <div className="flex-1 animate-section-in" style={{ animationDelay: '160ms' }}>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4 sm:mb-0">Sale Products</h2>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="border border-gray-300 dark:border-gray-800 rounded-lg px-4 py-2 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 cursor-pointer pr-8"
                >
                  <option value="featured">Featured</option>
                  <option value="newest">Newest</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                </select>
              </div>
              
              <ProductGrid
                selectedCategory={selectedCategory}
                sortBy={sortBy}
                priceRange={priceRange}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="relative py-14 px-4 lg:px-8">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1485968579580-b6d095142e6e?auto=format&fit=crop&w=1920&q=80')",
          }}
        ></div>
        <div className="absolute inset-0 bg-gradient-to-r from-red-950/75 via-black/45 to-orange-950/75"></div>
        <div className="relative max-w-7xl mx-auto text-center animate-section-in" style={{ animationDelay: '40ms' }}>
          <div className="inline-flex items-center gap-2 bg-red-500 text-white px-4 py-2 rounded-full text-sm font-bold mb-4">
            <i className="ri-fire-fill"></i>
            HOT DEALS
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Massive Sale Event
          </h1>
          <p className="text-lg text-gray-200 mb-6 max-w-2xl mx-auto">
            Incredible discounts on premium athletic wear. Don't miss out on these limited-time offers up to 70% off!
          </p>
          <div className="flex justify-center gap-4 flex-wrap">
            <span className="bg-red-500/30 backdrop-blur-sm text-white px-6 py-3 rounded-full text-sm font-medium">
              Up to 70% Off
            </span>
            <span className="bg-orange-500/30 backdrop-blur-sm text-white px-6 py-3 rounded-full text-sm font-medium">
              Limited Time
            </span>
            <span className="bg-yellow-500/30 backdrop-blur-sm text-white px-6 py-3 rounded-full text-sm font-medium">
              Free Shipping
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
