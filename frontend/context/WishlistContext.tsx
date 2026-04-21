'use client';

import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Product, fetchWishlist, addToWishlist, removeFromWishlist } from '@/lib/api';

interface WishlistItem {
  id: number;
  product: Product;
  product_id: number;
  created_at: string;
}

interface WishlistContextValue {
  items: WishlistItem[];
  totalItems: number;
  loading: boolean;
  addWishlistItem: (productId: number) => Promise<void>;
  removeWishlistItem: (productId: number) => Promise<void>;
  isInWishlist: (productId: number) => boolean;
}

const WishlistContext = createContext<WishlistContextValue | undefined>(undefined);

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error('useWishlist must be used within WishlistProvider');
  return ctx;
}

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadWishlist = async () => {
    try {
      setLoading(true);
      const data = await fetchWishlist();
      setItems(data);
    } catch (err) {
      console.error('Failed to load wishlist', err);
      // If unauthorized, it might just mean user is not logged in
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWishlist();
    const onAuthChanged = () => loadWishlist();
    window.addEventListener('excito-auth-changed', onAuthChanged as EventListener);
    return () => window.removeEventListener('excito-auth-changed', onAuthChanged as EventListener);
  }, []);

  const addWishlistItem = async (productId: number) => {
    try {
      await addToWishlist(productId);
      await loadWishlist();
    } catch (err) {
      console.error('Failed to add to wishlist', err);
      throw err;
    }
  };

  const removeWishlistItem = async (productId: number) => {
    try {
      await removeFromWishlist(productId);
      setItems(prev => prev.filter(item => item.product_id !== productId && item.product?.id !== productId));
    } catch (err) {
      console.error('Failed to remove from wishlist', err);
      throw err;
    }
  };

  const isInWishlist = (productId: number) => {
    return items.some(item => item.product_id === productId || item.product?.id === productId);
  };

  const totalItems = items.length;

  return (
    <WishlistContext.Provider value={{ items, totalItems, loading, addWishlistItem, removeWishlistItem, isInWishlist }}>
      {children}
    </WishlistContext.Provider>
  );
}
