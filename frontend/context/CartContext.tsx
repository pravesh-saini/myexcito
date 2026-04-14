'use client';

import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Product } from '@/lib/api';

interface CartItem {
  product: Product;
  quantity: number;
  size: string;
  color: string;
}

interface CartContextValue {
  items: CartItem[];
  totalItems: number;
  addItem: (product: Product, size: string, color: string) => void;
  removeItem: (index: number) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  const getCartKey = () => {
    if (typeof window === 'undefined') return 'excito_cart_guest';
    const raw = localStorage.getItem('excito_user');
    if (!raw) return 'excito_cart_guest';
    try {
      const user = JSON.parse(raw);
      if (user?.id) return `excito_cart_user_${user.id}`;
      if (user?.email) return `excito_cart_user_${String(user.email).toLowerCase()}`;
    } catch {
      return 'excito_cart_guest';
    }
    return 'excito_cart_guest';
  };

  const loadCart = () => {
    if (typeof window === 'undefined') return;
    const key = getCartKey();
    let raw = localStorage.getItem(key);

    if (!raw && key !== 'excito_cart_guest') {
      const guestRaw = localStorage.getItem('excito_cart_guest');
      if (guestRaw) {
        raw = guestRaw;
        localStorage.setItem(key, guestRaw);
      }
    }

    if (!raw) {
      setItems([]);
      return;
    }
    try {
      setItems(JSON.parse(raw));
    } catch {
      setItems([]);
    }
  };

  useEffect(() => {
    loadCart();
    const onAuthChanged = () => loadCart();
    window.addEventListener('excito-auth-changed', onAuthChanged as EventListener);
    return () => window.removeEventListener('excito-auth-changed', onAuthChanged as EventListener);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(getCartKey(), JSON.stringify(items));
  }, [items]);

  const addItem = (product: Product, size: string, color: string) => {
    setItems(prev => [...prev, { product, quantity: 1, size, color }]);
  };

  const removeItem = (index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const clearCart = () => setItems([]);

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider value={{ items, totalItems, addItem, removeItem, clearCart }}>
      {children}
    </CartContext.Provider>
  );
}
