'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
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
