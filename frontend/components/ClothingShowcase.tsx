
'use client';

import Link from 'next/link';

export default function ClothingShowcase() {
  const showcaseItems = [
    {
      id: 1,
      title: 'Athletic Essentials',
      description: 'Premium workout gear for peak performance',
      image: 'https://readdy.ai/api/search-image?query=Modern%20athletic%20clothing%20collection%20laid%20out%20professionally%20with%20premium%20sportswear%20including%20running%20shoes%20sneakers%20performance%20shirts%20shorts%20leggings%20sports%20bras%20athletic%20wear%20clean%20white%20background%20studio%20lighting%20contemporary%20fashion%20photography&width=800&height=600&seq=clothing-1&orientation=landscape',
      link: '/men'
    },
    {
      id: 2,
      title: 'Women\'s Active Collection',
      description: 'Stylish and functional activewear designed for women',
      image: 'https://readdy.ai/api/search-image?query=Womens%20athletic%20clothing%20collection%20beautifully%20arranged%20with%20sports%20bras%20leggings%20running%20shoes%20athletic%20tops%20workout%20gear%20activewear%20clean%20white%20background%20professional%20fashion%20photography%20studio%20lighting%20contemporary%20style&width=800&height=600&seq=clothing-2&orientation=landscape',
      link: '/women'
    },
    {
      id: 3,
      title: 'Kids Active Wear',
      description: 'Colorful and comfortable clothing for active kids',
      image: 'https://readdy.ai/api/search-image?query=Kids%20athletic%20clothing%20collection%20colorfully%20arranged%20with%20childrens%20sportswear%20sneakers%20t-shirts%20shorts%20hoodies%20active%20wear%20clean%20white%20background%20professional%20fashion%20photography%20studio%20lighting%20playful%20contemporary%20style&width=800&height=600&seq=clothing-3&orientation=landscape',
      link: '/kids'
    },
    {
      id: 4,
      title: 'Premium Footwear',
      description: 'High-performance shoes for every sport',
      image: 'https://readdy.ai/api/search-image?query=Premium%20athletic%20shoes%20collection%20professionally%20arranged%20with%20running%20shoes%20training%20sneakers%20sports%20footwear%20various%20colors%20and%20styles%20clean%20white%20background%20studio%20lighting%20contemporary%20product%20photography&width=800&height=600&seq=clothing-4&orientation=landscape',
      link: '/men'
    },
    {
      id: 5,
      title: 'Training Gear',
      description: 'Professional equipment for serious athletes',
      image: 'https://readdy.ai/api/search-image?query=Athletic%20training%20gear%20collection%20professionally%20arranged%20with%20performance%20clothing%20workout%20apparel%20training%20equipment%20athletic%20accessories%20clean%20white%20background%20studio%20lighting%20contemporary%20sports%20photography&width=800&height=600&seq=clothing-5&orientation=landscape',
      link: '/sale'
    },
    {
      id: 6,
      title: 'Casual Athletic',
      description: 'Comfortable everyday athletic wear',
      image: 'https://readdy.ai/api/search-image?query=Casual%20athletic%20clothing%20collection%20stylishly%20arranged%20with%20comfortable%20sportswear%20hoodies%20joggers%20casual%20sneakers%20lifestyle%20athletic%20wear%20clean%20white%20background%20professional%20fashion%20photography%20studio%20lighting&width=800&height=600&seq=clothing-6&orientation=landscape',
      link: '/women'
    }
  ];

  return (
    <section className="py-16 px-4 lg:px-8 bg-gray-50 dark:bg-gray-950">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900 dark:text-gray-100">Clothing Collections</h2>
          <p className="text-xl text-gray-600 dark:text-gray-400">Explore our premium athletic wear</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {showcaseItems.map((item) => (
            <Link
              key={item.id}
              href={item.link}
              className="group cursor-pointer animate-card-in"
              style={{ animationDelay: `${(item.id - 1) * 60}ms` }}
            >
              <div className="bg-white dark:bg-gray-900 rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
                <div className="relative overflow-hidden">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-64 object-cover object-top group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-gray-100">{item.title}</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">{item.description}</p>
                  <div className="flex items-center text-black dark:text-gray-100 font-medium">
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
