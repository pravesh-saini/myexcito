
'use client';

import { useState } from 'react';
import FilterSidebar from './FilterSidebar';
import ProductGrid from './ProductGrid';

export default function KidsPage() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('featured');
  const [priceRange, setPriceRange] = useState([0, 10000]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-100 via-orange-50 to-red-100 dark:from-gray-950 dark:via-gray-950 dark:to-gray-900">
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
                <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4 sm:mb-0">Kids' Products</h2>
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
              "url('https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=1600&q=80')",
          }}
        ></div>
        <div
          className="absolute inset-0 bg-cover bg-center mix-blend-screen opacity-40"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1526676037777-05a232554f77?auto=format&fit=crop&w=1600&q=80')",
          }}
        ></div>
        <div className="absolute inset-0 bg-gradient-to-r from-yellow-950/70 via-orange-900/55 to-red-950/70"></div>
        <div className="relative max-w-7xl mx-auto text-center animate-section-in" style={{ animationDelay: '40ms' }}>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Kids' Athletic Collection
          </h1>
          <p className="text-lg text-yellow-50 mb-6 max-w-2xl mx-auto">
            Colorful, comfortable, and durable activewear for your little athletes. Let them play, explore, and grow in style.
          </p>
          <div className="flex justify-center gap-4 flex-wrap">
            <span className="bg-yellow-300/20 backdrop-blur-sm text-yellow-100 px-6 py-3 rounded-full text-sm font-medium">
              Fun Colors
            </span>
            <span className="bg-orange-300/20 backdrop-blur-sm text-orange-100 px-6 py-3 rounded-full text-sm font-medium">
              Comfortable Fit
            </span>
            <span className="bg-red-300/20 backdrop-blur-sm text-red-100 px-6 py-3 rounded-full text-sm font-medium">
              Durable Quality
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
