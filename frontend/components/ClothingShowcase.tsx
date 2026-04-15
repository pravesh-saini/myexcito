
'use client';

import Link from 'next/link';

export default function ClothingShowcase() {
  const showcaseItems = [
    {
      id: 1,
      title: 'Athletic Essentials',
      description: 'Premium workout gear for peak performance',
      image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1200&q=80',
      link: '/men'
    },
    {
      id: 2,
      title: 'Women\'s Active Collection',
      description: 'Stylish and functional activewear designed for women',
      image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=1200&q=80',
      link: '/women'
    },
    {
      id: 3,
      title: 'Kids Active Wear',
      description: 'Colorful and comfortable clothing for active kids',
      image: 'https://images.unsplash.com/photo-1519340241574-2cec6aef0c01?auto=format&fit=crop&w=1200&q=80',
      link: '/kids'
    },
    {
      id: 4,
      title: 'Premium Footwear',
      description: 'High-performance shoes for every sport',
      image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1200&q=80',
      link: '/men'
    },
    {
      id: 5,
      title: 'Training Gear',
      description: 'Professional equipment for serious athletes',
      image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=1200&q=80',
      link: '/sale'
    },
    {
      id: 6,
      title: 'Casual Athletic',
      description: 'Comfortable everyday athletic wear',
      image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1200&q=80',
      link: '/women'
    }
  ];

  return (
    <section className="py-16 px-4 lg:px-8 bg-[linear-gradient(180deg,#eef2ff_0%,#f8fafc_100%)] dark:bg-gray-950 smooth-transitions">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12 animate-section-in">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900 dark:text-gray-100">Clothing Collections</h2>
          <p className="text-xl text-gray-600 dark:text-gray-400">Explore our premium athletic wear</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {showcaseItems.map((item) => (
            <Link
              key={item.id}
              href={item.link}
              className="group cursor-pointer animate-card-in hover-lift"
              style={{ animationDelay: `${(item.id - 1) * 60}ms` }}
            >
              <div className="bg-white dark:bg-gray-900 rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl smooth-transitions">
                <div className="relative overflow-hidden">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-64 object-cover object-top group-hover:scale-110 smooth-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 smooth-opacity duration-300"></div>
                </div>
                <div className="p-6 smooth-transitions">
                  <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-gray-100 group-hover:text-black dark:group-hover:text-white smooth-colors">{item.title}</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4 group-hover:text-gray-700 dark:group-hover:text-gray-300 smooth-colors">{item.description}</p>
                  <div className="flex items-center text-black dark:text-gray-100 font-medium group-hover:translate-x-2 smooth-transform">
                    <span>Shop Now</span>
                    <i className="ri-arrow-right-line ml-2"></i>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
