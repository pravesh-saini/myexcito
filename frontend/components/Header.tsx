
'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import CartSidebar from './CartSidebar';
import ThemeToggle from './ThemeToggle';

export default function Header() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [user, setUser] = useState<{ email: string; firstName?: string } | null>(null);
  const { totalItems } = useCart();
  const [cartOpen, setCartOpen] = useState(false);
  const openCart = () => setCartOpen(true);
  const closeCart = () => setCartOpen(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stored = localStorage.getItem('excito_user');
    if (stored) {
      try { setUser(JSON.parse(stored)); } catch {}
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('excito_user');
    setUser(null);
    setIsUserMenuOpen(false);
    router.push('/');
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Search query:', searchQuery);
  };

  return (
    <>
      <header className="bg-white dark:bg-gray-950 shadow-sm sticky top-0 z-50 border-b border-transparent dark:border-gray-900">
      <div className="max-w-7xl mx-auto px-4 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-2">
            <div className="relative">
              <button
                onClick={() => setIsCategoriesOpen(!isCategoriesOpen)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-900 rounded-lg transition-colors cursor-pointer flex items-center space-x-2"
              >
                <div className="w-5 h-5 flex flex-col justify-center space-y-1">
                  <div className="w-full h-0.5 bg-gray-700 dark:bg-gray-200"></div>
                  <div className="w-full h-0.5 bg-gray-700 dark:bg-gray-200"></div>
                  <div className="w-full h-0.5 bg-gray-700 dark:bg-gray-200"></div>
                </div>
                <span className="text-gray-700 dark:text-gray-200 font-medium hidden md:block">Categories</span>
              </button>
              
              {isCategoriesOpen && (
                <div className="absolute top-full left-0 mt-2 w-64 bg-white dark:bg-gray-950 rounded-lg shadow-lg border border-gray-200 dark:border-gray-800 z-50">
                  <div className="p-4">
                    <div className="space-y-3">
                      <div>
                        <Link href="/men" className="block text-gray-900 dark:text-gray-100 font-medium hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer">
                          Men's Collection
                        </Link>
                        <div className="ml-3 mt-1 space-y-1">
                          <Link href="/men" className="block text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors cursor-pointer">T-Shirts & Tops</Link>
                          <Link href="/men" className="block text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors cursor-pointer">Pants & Shorts</Link>
                          <Link href="/men" className="block text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors cursor-pointer">Activewear</Link>
                        </div>
                      </div>
                      
                      <div>
                        <Link href="/women" className="block text-gray-900 dark:text-gray-100 font-medium hover:text-pink-600 dark:hover:text-pink-400 transition-colors cursor-pointer">
                          Women's Collection
                        </Link>
                        <div className="ml-3 mt-1 space-y-1">
                          <Link href="/women" className="block text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors cursor-pointer">Dresses & Tops</Link>
                          <Link href="/women" className="block text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors cursor-pointer">Bottoms</Link>
                          <Link href="/women" className="block text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors cursor-pointer">Sportswear</Link>
                        </div>
                      </div>
                      
                      <div>
                        <Link href="/kids" className="block text-gray-900 dark:text-gray-100 font-medium hover:text-yellow-600 dark:hover:text-yellow-400 transition-colors cursor-pointer">
                          Kids Collection
                        </Link>
                        <div className="ml-3 mt-1 space-y-1">
                          <Link href="/kids" className="block text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors cursor-pointer">Boys Clothing</Link>
                          <Link href="/kids" className="block text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors cursor-pointer">Girls Clothing</Link>
                          <Link href="/kids" className="block text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors cursor-pointer">Active Kids</Link>
                        </div>
                      </div>
                      
                      <div className="pt-2 border-t border-gray-200 dark:border-gray-800">
                        <Link href="/sale" className="block text-red-600 font-medium hover:text-red-700 dark:hover:text-red-400 transition-colors cursor-pointer">
                          🔥 Sale & Deals
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <Link href="/" className="text-2xl font-bold text-black dark:text-white cursor-pointer" style={{ fontFamily: '"Pacifico", serif' }}>
              EXCITO
            </Link>
          </div>
          
          <nav className="hidden md:flex items-center space-x-8">
            <Link href="/men" className="text-gray-700 dark:text-gray-200 hover:text-black dark:hover:text-white transition-colors cursor-pointer">
              Men
            </Link>
            <Link href="/women" className="text-gray-700 dark:text-gray-200 hover:text-black dark:hover:text-white transition-colors cursor-pointer">
              Women
            </Link>
            <Link href="/kids" className="text-gray-700 dark:text-gray-200 hover:text-black dark:hover:text-white transition-colors cursor-pointer">
              Kids
            </Link>
            <Link href="/sale" className="text-red-600 hover:text-red-700 transition-colors cursor-pointer font-medium">
              Sale
            </Link>
          </nav>

          <div className="flex items-center space-x-4">
            <form onSubmit={handleSearch} className="hidden md:block">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-64 px-4 py-2 pl-10 border border-gray-300 dark:border-gray-800 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/20 dark:focus:ring-white/15 focus:border-transparent text-sm"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <i className="ri-search-line text-gray-400"></i>
                </div>
              </div>
            </form>

            <div className="flex items-center space-x-3">
              <ThemeToggle />
              <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-900 rounded-full transition-colors cursor-pointer">
                <i className="ri-heart-line text-gray-600 dark:text-gray-300 w-5 h-5 flex items-center justify-center"></i>
              </button>
              <button onClick={openCart} className="relative p-2 hover:bg-gray-100 dark:hover:bg-gray-900 rounded-full transition-colors cursor-pointer">
                <i className="ri-shopping-cart-line text-gray-600 dark:text-gray-300 w-5 h-5 flex items-center justify-center"></i>
                {totalItems > 0 && <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs px-1 rounded-full">{totalItems}</span>}
              </button>

              {/* User menu */}
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setIsUserMenuOpen(p => !p)}
                  className="flex items-center space-x-1.5 p-1.5 hover:bg-gray-100 dark:hover:bg-gray-900 rounded-full transition-colors cursor-pointer"
                >
                  {user ? (
                    <div className="w-7 h-7 rounded-full bg-gray-900 dark:bg-white flex items-center justify-center">
                      <span className="text-white text-xs font-bold">{(user.firstName || user.email)[0].toUpperCase()}</span>
                    </div>
                  ) : (
                    <i className="ri-user-line text-gray-600 dark:text-gray-300 w-5 h-5 flex items-center justify-center"></i>
                  )}
                </button>

                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-52 bg-white dark:bg-gray-950 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 z-50 overflow-hidden">
                    {user ? (
                      <>
                        <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
                          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                            {user.firstName ? user.firstName : user.email.split('@')[0]}
                          </p>
                          <p className="text-xs text-gray-400 truncate">{user.email}</p>
                        </div>
                        <div className="py-1">
                          <Link href="/orders" onClick={() => setIsUserMenuOpen(false)}
                            className="flex items-center space-x-2 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors">
                            <i className="ri-file-list-line text-gray-400"></i>
                            <span>My Orders</span>
                          </Link>
                          <Link href="/wishlist" onClick={() => setIsUserMenuOpen(false)}
                            className="flex items-center space-x-2 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors">
                            <i className="ri-heart-line text-gray-400"></i>
                            <span>Wishlist</span>
                          </Link>
                          <Link href="/account" onClick={() => setIsUserMenuOpen(false)}
                            className="flex items-center space-x-2 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors">
                            <i className="ri-settings-line text-gray-400"></i>
                            <span>Account Settings</span>
                          </Link>
                          <div className="border-t border-gray-100 dark:border-gray-800 mt-1 pt-1">
                            <button onClick={handleLogout}
                              className="w-full flex items-center space-x-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors">
                              <i className="ri-logout-box-r-line"></i>
                              <span>Sign Out</span>
                            </button>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="p-3 space-y-2">
                        <Link href="/login" onClick={() => setIsUserMenuOpen(false)}
                          className="block w-full text-center bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-semibold py-2.5 rounded-xl hover:bg-gray-700 dark:hover:bg-gray-100 transition-colors">
                          Sign In
                        </Link>
                        <Link href="/signup" onClick={() => setIsUserMenuOpen(false)}
                          className="block w-full text-center border border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-200 text-sm font-medium py-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors">
                          Create Account
                        </Link>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-900 rounded-full transition-colors cursor-pointer"
            >
              <i className="ri-menu-line text-gray-600 dark:text-gray-300 w-5 h-5 flex items-center justify-center"></i>
            </button>
          </div>
        </div>

        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200 dark:border-gray-900">
            <nav className="flex flex-col space-y-4">
              <Link href="/men" className="text-gray-700 dark:text-gray-200 hover:text-black dark:hover:text-white transition-colors cursor-pointer">
                Men
              </Link>
              <Link href="/women" className="text-gray-700 dark:text-gray-200 hover:text-black dark:hover:text-white transition-colors cursor-pointer">
                Women
              </Link>
              <Link href="/kids" className="text-gray-700 dark:text-gray-200 hover:text-black dark:hover:text-white transition-colors cursor-pointer">
                Kids
              </Link>
              <Link href="/sale" className="text-red-600 hover:text-red-700 transition-colors cursor-pointer font-medium">
                Sale
              </Link>
            </nav>
            <form onSubmit={handleSearch} className="mt-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 pl-10 border border-gray-300 dark:border-gray-800 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/20 dark:focus:ring-white/15 focus:border-transparent text-sm"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <i className="ri-search-line text-gray-400"></i>
                </div>
              </div>
            </form>
          </div>
        )}
      </div>
      </header>

      <CartSidebar isOpen={cartOpen} onClose={closeCart} />
    </>
  );
}
