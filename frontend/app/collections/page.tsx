import Link from 'next/link';
import Footer from '@/components/Footer';

const collectionCards = [
  {
    title: "Men's Collection",
    subtitle: 'Power, pace, and precision fits.',
    href: '/men',
    image:
      'https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?auto=format&fit=crop&w=1600&q=80',
    badge: 'High Intensity',
  },
  {
    title: "Women's Collection",
    subtitle: 'Training looks with confidence-first cuts.',
    href: '/women',
    image:
      'https://images.unsplash.com/photo-1518310383802-640c2de311b2?auto=format&fit=crop&w=1600&q=80',
    badge: 'Studio to Street',
  },
  {
    title: "Kids' Collection",
    subtitle: 'Play-ready comfort with durable quality.',
    href: '/kids',
    image:
      'https://images.unsplash.com/photo-1516627145497-ae6968895b74?auto=format&fit=crop&w=1600&q=80',
    badge: 'Active Play',
  },
  {
    title: 'Sale Collection',
    subtitle: 'Big savings on bestselling essentials.',
    href: '/sale',
    image:
      'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&w=1600&q=80',
    badge: 'Up To 70% Off',
  },
];

export default function CollectionsPage() {
  return (
    <>
      <main className="min-h-screen bg-[linear-gradient(180deg,#eef2ff_0%,#f8fafc_55%,#ffffff_100%)] dark:bg-gray-950">
        <section className="mx-auto max-w-7xl px-4 py-12 lg:px-8">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            {collectionCards.map((card, index) => (
              <Link
                key={card.title}
                href={card.href}
                className="group animate-card-in overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm transition hover:shadow-xl dark:border-gray-800 dark:bg-gray-900"
                style={{ animationDelay: `${index * 60}ms` }}
              >
                <div className="relative h-72 overflow-hidden">
                  <img src={card.image} alt={card.title} className="h-full w-full object-cover transition duration-500 group-hover:scale-110" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/30 to-transparent"></div>
                  <span className="absolute left-4 top-4 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
                    {card.badge}
                  </span>
                </div>

                <div className="p-6">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{card.title}</h2>
                  <p className="mt-2 text-gray-600 dark:text-gray-400">{card.subtitle}</p>
                  <div className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-gray-100">
                    Explore Collection
                    <i className="ri-arrow-right-line"></i>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section className="relative overflow-hidden px-4 py-14 lg:px-8">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage:
                "url('https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=2000&q=80')",
            }}
          ></div>
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-950/80 via-black/55 to-cyan-950/70"></div>

          <div className="relative mx-auto max-w-7xl text-white">
            <p className="inline-flex rounded-full bg-white/20 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] backdrop-blur">
              Curated Collections
            </p>
            <h1 className="mt-4 max-w-3xl text-4xl font-bold leading-tight md:text-5xl">
              Find your lane. Pick your collection.
            </h1>
            <p className="mt-4 max-w-2xl text-base text-gray-200 md:text-lg">
              Explore focused drops for men, women, kids, and sale picks built for performance and comfort.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/shop" className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-black transition hover:bg-gray-100">
                Shop Everything
              </Link>
              <Link href="/sale" className="rounded-full border border-white/70 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white hover:text-black">
                See Deals
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
