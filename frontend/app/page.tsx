
'use client';

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import HeroSection from '@/components/HeroSection';
import FeaturedProducts from '@/components/FeaturedProducts';
import CategoryGrid from '@/components/CategoryGrid';
import ClothingShowcase from '@/components/ClothingShowcase';
import NewsletterSection from '@/components/NewsletterSection';

export default function Home() {
  return (
    <>
      <Header />
      <main>
        <div className="animate-section-in" style={{ animationDelay: '20ms' }}>
          <HeroSection />
        </div>
        <div className="animate-section-in" style={{ animationDelay: '80ms' }}>
          <FeaturedProducts />
        </div>
        <div className="animate-section-in" style={{ animationDelay: '140ms' }}>
          <CategoryGrid />
        </div>
        <div className="animate-section-in" style={{ animationDelay: '200ms' }}>
          <ClothingShowcase />
        </div>
        <div className="animate-section-in" style={{ animationDelay: '260ms' }}>
          <NewsletterSection />
        </div>
      </main>
      <Footer />
    </>
  );
}
