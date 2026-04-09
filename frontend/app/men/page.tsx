
'use client';

import { useState } from 'react';
import FilterSidebar from './FilterSidebar';
import ProductGrid from './ProductGrid';

export default function MenPage() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedBrand, setSelectedBrand] = useState('all');
  const [sortBy, setSortBy] = useState('featured');
  const [priceRange, setPriceRange] = useState([0, 500]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800">
      {/* Hero Section */}
      <div className="relative py-24 px-4 lg:px-8">
        <div className="absolute inset-0 bg-black/40"></div>
        <div className="relative max-w-7xl mx-auto text-center animate-section-in" style={{ animationDelay: '40ms' }}>
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
            Men's Athletic Collection
          </h1>
          <p className="text-xl text-gray-200 mb-8 max-w-2xl mx-auto">
            Discover premium performance gear designed for the modern athlete. Push your limits with our cutting-edge sportswear.
          </p>
          <div className="flex justify-center gap-4 flex-wrap">
            <span className="bg-white/20 backdrop-blur-sm text-white px-6 py-3 rounded-full text-sm font-medium">
              Premium Quality
            </span>
            <span className="bg-white/20 backdrop-blur-sm text-white px-6 py-3 rounded-full text-sm font-medium">
              Performance Focused
            </span>
            <span className="bg-white/20 backdrop-blur-sm text-white px-6 py-3 rounded-full text-sm font-medium">
              Modern Design
            </span>
          </div>
        </div>
      </div>

      {/* Products Section */}
      <div className="bg-white dark:bg-gray-950">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 py-12">
          <div className="flex flex-col lg:flex-row gap-8">
            <div className="animate-section-in" style={{ animationDelay: '100ms' }}>
              <FilterSidebar
                selectedCategory={selectedCategory}
                setSelectedCategory={setSelectedCategory}
                selectedBrand={selectedBrand}
                setSelectedBrand={setSelectedBrand}
                priceRange={priceRange}
                setPriceRange={setPriceRange}
              />
            </div>
            
            <div className="flex-1 animate-section-in" style={{ animationDelay: '160ms' }}>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4 sm:mb-0">Men's Products</h2>
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
                selectedBrand={selectedBrand}
                sortBy={sortBy}
                priceRange={priceRange}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
