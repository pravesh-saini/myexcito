'use client';

import Link from 'next/link';

export default function CategoryGrid() {
  const categories = [
    {
      title: 'Men',
      subtitle: 'Athletic Wear',
      image: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=1400&q=80',
      href: '/men'
    },
    {
      title: 'Women',
      subtitle: 'Performance Gear',
      image: 'https://images.unsplash.com/photo-1518310383802-640c2de311b2?auto=format&fit=crop&w=1400&q=80',
      href: '/women'
    },
    {
      title: 'Kids',
      subtitle: 'Active Play',
      image: 'https://images.unsplash.com/photo-1472162072942-cd5147eb3902?auto=format&fit=crop&w=1400&q=80',
      href: '/kids'
    }
  ];

  return (
    <section className="py-16 px-4 lg:px-8 bg-[linear-gradient(180deg,#f8fafc_0%,#eef2ff_100%)] dark:bg-gray-950">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900 dark:text-gray-100">Shop by Category</h2>
          <p className="text-xl text-gray-600 dark:text-gray-400">Find your perfect fit</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {categories.map((category, index) => (
            <Link
              key={index}
              href={category.href}
              className="group cursor-pointer animate-card-in"
              style={{ animationDelay: `${index * 60}ms` }}
            >
              <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-gray-900 shadow-lg hover:shadow-xl transition-shadow">
                <img
                  src={category.image}
                  alt={category.title}
                  className="w-full h-80 object-cover object-center group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent group-hover:from-black/80 transition-colors"></div>
                <div className="absolute bottom-6 left-6 text-white">
                  <h3 className="text-2xl font-bold mb-2">{category.title}</h3>
                  <p className="text-lg opacity-90">{category.subtitle}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}