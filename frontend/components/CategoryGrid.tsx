'use client';

import Link from 'next/link';

export default function CategoryGrid() {
  const categories = [
    {
      title: 'Men',
      subtitle: 'Athletic Wear',
      image: 'https://readdy.ai/api/search-image?query=Athletic%20man%20wearing%20modern%20sportswear%20in%20clean%20studio%20setting%20with%20contemporary%20athletic%20clothing%20professional%20lifestyle%20photography%20minimalist%20background%20confident%20pose%20premium%20menswear%20fashion%20shoot&width=600&height=400&seq=category-men&orientation=landscape',
      href: '/men'
    },
    {
      title: 'Women',
      subtitle: 'Performance Gear',
      image: 'https://readdy.ai/api/search-image?query=Athletic%20woman%20wearing%20modern%20sportswear%20in%20clean%20studio%20setting%20with%20contemporary%20athletic%20clothing%20professional%20lifestyle%20photography%20minimalist%20background%20confident%20pose%20premium%20womenswear%20fashion%20shoot&width=600&height=400&seq=category-women&orientation=landscape',
      href: '/women'
    },
    {
      title: 'Kids',
      subtitle: 'Active Play',
      image: 'https://readdy.ai/api/search-image?query=Happy%20child%20wearing%20colorful%20athletic%20sportswear%20in%20clean%20studio%20setting%20with%20contemporary%20kids%20athletic%20clothing%20professional%20lifestyle%20photography%20minimalist%20background%20playful%20pose%20premium%20childrenswear%20fashion%20shoot&width=600&height=400&seq=category-kids&orientation=landscape',
      href: '/kids'
    }
  ];

  return (
    <section className="py-16 px-4 lg:px-8 bg-gray-50 dark:bg-gray-950">
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
              <div className="relative overflow-hidden rounded-lg bg-white dark:bg-gray-900 shadow-lg hover:shadow-xl transition-shadow">
                <img
                  src={category.image}
                  alt={category.title}
                  className="w-full h-80 object-cover object-top group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors"></div>
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