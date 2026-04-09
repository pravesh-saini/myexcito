
'use client';

import { useState } from 'react';

interface FilterSidebarProps {
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
  selectedBrand: string;
  setSelectedBrand: (brand: string) => void;
  priceRange: number[];
  setPriceRange: (range: number[]) => void;
}

export default function FilterSidebar({
  selectedCategory,
  setSelectedCategory,
  selectedBrand,
  setSelectedBrand,
  priceRange,
  setPriceRange
}: FilterSidebarProps) {
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const categories = [
    { id: 'all', name: 'All Categories' },
    { id: 'shoes', name: 'Shoes' },
    { id: 'tops', name: 'Tops & Shirts' },
    { id: 'bottoms', name: 'Bottoms' },
    { id: 'outerwear', name: 'Outerwear' },
    { id: 'sets', name: 'Sets & Bundles' },
    { id: 'kids', name: 'Kids' }
  ];

  const brands = [
    { id: 'all', name: 'All Brands' },
    { id: 'excito', name: 'Excito' },
    { id: 'nike', name: 'Nike' },
    { id: 'adidas', name: 'Adidas' },
    { id: 'underarmour', name: 'Under Armour' },
    { id: 'puma', name: 'Puma' }
  ];

  const discountRanges = [
    { id: 'all', name: 'All Discounts' },
    { id: '70', name: '70% Off or More' },
    { id: '60', name: '60% Off or More' },
    { id: '50', name: '50% Off or More' },
    { id: '40', name: '40% Off or More' },
    { id: '30', name: '30% Off or More' }
  ];

  const sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
  const colors = ['Black', 'White', 'Gray', 'Navy', 'Blue', 'Red', 'Purple', 'Pink', 'Green'];

  const sidebarContent = (
    <div className="space-y-6">
      <div className="bg-red-50 dark:bg-red-950/30 p-4 rounded-2xl border border-red-200 dark:border-red-900/50">
        <h3 className="font-semibold text-red-800 dark:text-red-200 mb-4">Sale Categories</h3>
        <div className="space-y-2">
          {categories.map((category) => (
            <label key={category.id} className="flex items-center cursor-pointer">
              <input
                type="radio"
                name="category"
                value={category.id}
                checked={selectedCategory === category.id}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="mr-3 cursor-pointer"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">{category.name}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="bg-gray-50 dark:bg-gray-900/40 p-4 rounded-2xl border border-gray-200/60 dark:border-gray-800">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Discount</h3>
        <div className="space-y-2">
          {discountRanges.map((range) => (
            <label key={range.id} className="flex items-center cursor-pointer">
              <input type="radio" name="discount" value={range.id} className="mr-3 cursor-pointer" />
              <span className="text-sm text-gray-700 dark:text-gray-300">{range.name}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="bg-gray-50 dark:bg-gray-900/40 p-4 rounded-2xl border border-gray-200/60 dark:border-gray-800">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Brand</h3>
        <div className="space-y-2">
          {brands.map((brand) => (
            <label key={brand.id} className="flex items-center cursor-pointer">
              <input
                type="radio"
                name="brand"
                value={brand.id}
                checked={selectedBrand === brand.id}
                onChange={(e) => setSelectedBrand(e.target.value)}
                className="mr-3 cursor-pointer"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">{brand.name}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="bg-gray-50 dark:bg-gray-900/40 p-4 rounded-2xl border border-gray-200/60 dark:border-gray-800">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Price Range</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">₹{priceRange[0]}</span>
            <span className="text-sm text-gray-600 dark:text-gray-400">₹{priceRange[1]}</span>
          </div>
          <input
            type="range"
            min="0"
            max="500"
            value={priceRange[1]}
            onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
            className="w-full cursor-pointer"
          />
          <div className="flex gap-2">
            <input
              type="number"
              value={priceRange[0]}
              onChange={(e) => setPriceRange([parseInt(e.target.value), priceRange[1]])}
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-800 rounded-xl text-sm bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100"
              min="0"
              max="500"
            />
            <input
              type="number"
              value={priceRange[1]}
              onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-800 rounded-xl text-sm bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100"
              min="0"
              max="500"
            />
          </div>
        </div>
      </div>

      <div className="bg-gray-50 dark:bg-gray-900/40 p-4 rounded-2xl border border-gray-200/60 dark:border-gray-800">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Size</h3>
        <div className="grid grid-cols-3 gap-2">
          {sizes.map((size) => (
            <button
              key={size}
              className="border border-gray-200 dark:border-gray-800 rounded-xl px-3 py-2 text-sm text-gray-800 dark:text-gray-200 hover:border-red-500 dark:hover:border-red-400 transition-colors whitespace-nowrap cursor-pointer"
            >
              {size}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-gray-50 dark:bg-gray-900/40 p-4 rounded-2xl border border-gray-200/60 dark:border-gray-800">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Color</h3>
        <div className="grid grid-cols-4 gap-2">
          {colors.map((color) => (
            <button
              key={color}
              className={`w-8 h-8 rounded-full border-2 border-gray-300 dark:border-gray-700 hover:border-red-500 dark:hover:border-red-400 transition-colors cursor-pointer ${
                color === 'Black'
                  ? 'bg-black'
                  : color === 'White'
                    ? 'bg-white'
                    : color === 'Gray'
                      ? 'bg-gray-400'
                      : color === 'Navy'
                        ? 'bg-blue-900'
                        : color === 'Blue'
                          ? 'bg-blue-500'
                          : color === 'Red'
                            ? 'bg-red-500'
                            : color === 'Purple'
                              ? 'bg-purple-500'
                              : color === 'Pink'
                                ? 'bg-pink-400'
                                : color === 'Green'
                                  ? 'bg-green-500'
                                  : 'bg-gray-300'
              }`}
              title={color}
            ></button>
          ))}
        </div>
      </div>

      <div className="bg-orange-50 dark:bg-orange-950/25 p-4 rounded-2xl border border-orange-200 dark:border-orange-900/50">
        <h3 className="font-semibold text-orange-800 dark:text-orange-200 mb-2">Limited Time</h3>
        <div className="space-y-2">
          <label className="flex items-center cursor-pointer">
            <input type="checkbox" className="mr-2 cursor-pointer" />
            <span className="text-sm text-gray-700 dark:text-gray-300">Flash Sale Items</span>
          </label>
          <label className="flex items-center cursor-pointer">
            <input type="checkbox" className="mr-2 cursor-pointer" />
            <span className="text-sm text-gray-700 dark:text-gray-300">Limited Stock</span>
          </label>
          <label className="flex items-center cursor-pointer">
            <input type="checkbox" className="mr-2 cursor-pointer" />
            <span className="text-sm text-gray-700 dark:text-gray-300">Clearance Items</span>
          </label>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <button
        onClick={() => setIsFilterOpen(!isFilterOpen)}
			className="lg:hidden mb-4 bg-red-600 text-white px-4 py-2.5 rounded-xl flex items-center gap-2 whitespace-nowrap cursor-pointer shadow-sm"
      >
        <i className="ri-filter-line"></i>
        Filters
      </button>

		{/* Mobile: slide-in panel */}
		<div className={`lg:hidden fixed inset-0 z-40 ${isFilterOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}>
			<div
				className={`absolute inset-0 bg-black/40 backdrop-blur-[2px] transition-opacity ${
					isFilterOpen ? 'opacity-100 animate-fade-in' : 'opacity-0'
				}`}
				onClick={() => setIsFilterOpen(false)}
			/>
			<div
        className={`absolute left-0 top-0 h-full w-[85vw] max-w-[320px] bg-white dark:bg-gray-950 border-r border-gray-200 dark:border-gray-800 shadow-2xl p-4 overflow-y-auto transform transition-transform duration-300 ${
					isFilterOpen ? 'translate-x-0' : '-translate-x-full'
				}`}
			>
				<div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Filters</h2>
					<button
						type="button"
						onClick={() => setIsFilterOpen(false)}
            className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors"
						aria-label="Close filters"
					>
            <i className="ri-close-line text-xl text-gray-700 dark:text-gray-200" />
					</button>
				</div>
				{sidebarContent}
				<div className="h-8" />
			</div>
		</div>

		{/* Desktop */}
		<div className="hidden lg:block w-full lg:w-64">
			<div className="lg:sticky lg:top-24">{sidebarContent}</div>
		</div>
    </>
  );
}
