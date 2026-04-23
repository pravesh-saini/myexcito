'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createPortal } from 'react-dom';
import { Product } from '@/lib/api';
import { useCart } from '@/context/CartContext';
import { getColorImageUrl } from '@/lib/productImages';

const MAX_QUANTITY = 20;

function clampQuantity(value: number) {
  if (!Number.isFinite(value)) return 1;
  return Math.min(MAX_QUANTITY, Math.max(1, Math.floor(value)));
}

export interface QuickAddSelection {
  product: Product;
  size: string;
  color: string;
  quantity?: number;
}

interface QuickAddModalProps {
  quickAdd: QuickAddSelection | null;
  onClose: () => void;
}

export default function QuickAddModal({ quickAdd, onClose }: QuickAddModalProps) {
  const router = useRouter();
  const { addItem } = useCart();

  const [mounted, setMounted] = useState(false);
  const [size, setSize] = useState('');
  const [color, setColor] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [activeImageUrl, setActiveImageUrl] = useState('');

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!quickAdd) return;
    setSize(quickAdd.size || quickAdd.product.sizes?.[0] || '');
    const initialColor = quickAdd.color || quickAdd.product.colors?.[0] || '';
    setColor(initialColor);
    setQuantity(clampQuantity(quickAdd.quantity || 1));
    
    // Set initial image from color or main image
    setActiveImageUrl(getColorImageUrl(quickAdd.product, initialColor));
  }, [quickAdd]);

  // Update image when color changes
  useEffect(() => {
    if (!quickAdd) return;
    setActiveImageUrl(getColorImageUrl(quickAdd.product, color));
  }, [color, quickAdd]);

  useEffect(() => {
    if (!quickAdd) return;
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onEscape);
    return () => window.removeEventListener('keydown', onEscape);
  }, [quickAdd, onClose]);

  useEffect(() => {
    if (!quickAdd) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [quickAdd]);

  // We use activeImageUrl state instead of useMemo to allow manual gallery selection
  
  if (!mounted || !quickAdd) return null;

  const galleryImages = quickAdd.product.gallery_image_urls || [];
  // Combine main image and gallery images for a full list
  const allImages = [
    { id: -1, url: quickAdd.product.image_url, alt_text: 'Main view' },
    ...galleryImages
  ];

  const increaseQuantity = () => setQuantity((prev) => clampQuantity(prev + 1));
  const decreaseQuantity = () => setQuantity((prev) => clampQuantity(prev - 1));

  const handleAddToCart = () => {
    addItem(quickAdd.product, size, color, quantity);
    onClose();
  };

  const handleBuyNow = () => {
    addItem(quickAdd.product, size, color, quantity);
    onClose();
    router.push('/checkout');
  };

  return createPortal(
    <div className="fixed inset-0 z-[120] grid place-items-center bg-black/55 p-4" onClick={onClose}>
      <div
        className="w-full max-w-sm rounded-2xl border border-gray-100 bg-white p-6 shadow-xl dark:border-gray-800 dark:bg-gray-950 max-h-[90vh] overflow-y-auto"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between">
          <h3 className="font-bold text-gray-900 dark:text-gray-100">{quickAdd.product.name}</h3>
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer text-gray-400 transition-colors hover:text-gray-600 dark:hover:text-gray-200"
            aria-label="Close"
          >
            <i className="ri-close-line text-xl"></i>
          </button>
        </div>

        <div className="mb-4">
          <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
            {activeImageUrl ? (
              <img src={activeImageUrl} alt={quickAdd.product.name} className="h-48 w-full object-contain" />
            ) : (
              <div className="flex h-48 w-full items-center justify-center">
                <i className="ri-image-line text-3xl text-gray-300"></i>
              </div>
            )}
          </div>
          
          {allImages.length > 1 && (
            <div className="mt-2 flex gap-2 overflow-x-auto pb-1 no-scrollbar">
              {allImages.map((img) => (
                <button
                  key={img.id}
                  type="button"
                  onClick={() => setActiveImageUrl(img.url)}
                  className={`relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-lg border-2 transition-all ${
                    activeImageUrl === img.url ? 'border-black dark:border-white' : 'border-transparent opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={img.url} alt={img.alt_text} className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="mb-4">
          <p className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Select Size</p>
          {(quickAdd.product.sizes || []).length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {(quickAdd.product.sizes || []).map((itemSize) => (
                <button
                  key={itemSize}
                  type="button"
                  onClick={() => setSize(itemSize)}
                  className={`cursor-pointer rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
                    size === itemSize
                      ? 'border-black bg-black text-white'
                      : 'border-gray-300 text-gray-700 hover:border-black dark:border-gray-700 dark:text-gray-300 dark:hover:border-gray-200'
                  }`}
                >
                  {itemSize}
                </button>
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-500 dark:text-gray-400">No size options for this product.</p>
          )}
        </div>

        <div className="mb-4">
          <p className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Select Color</p>
          {(quickAdd.product.colors || []).length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {(quickAdd.product.colors || []).map((itemColor) => (
                <button
                  key={itemColor}
                  type="button"
                  onClick={() => setColor(itemColor)}
                  className={`cursor-pointer rounded-lg border px-3 py-1.5 text-sm capitalize transition-colors ${
                    color === itemColor
                      ? 'border-black bg-black text-white'
                      : 'border-gray-300 text-gray-700 hover:border-black dark:border-gray-700 dark:text-gray-300 dark:hover:border-gray-200'
                  }`}
                >
                  {itemColor}
                </button>
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-500 dark:text-gray-400">No color options for this product.</p>
          )}
        </div>

        <div className="mb-6">
          <p className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Quantity</p>
          <div className="inline-flex items-center overflow-hidden rounded-lg border border-gray-300 dark:border-gray-700">
            <button
              type="button"
              onClick={decreaseQuantity}
              className="cursor-pointer px-3 py-2 text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-900"
              aria-label="Decrease quantity"
            >
              -
            </button>
            <input
              type="number"
              min={1}
              max={MAX_QUANTITY}
              value={quantity}
              onChange={(event) => setQuantity(clampQuantity(Number(event.target.value || 1)))}
              className="w-14 border-x border-gray-300 bg-transparent px-2 py-2 text-center text-sm text-gray-900 outline-none dark:border-gray-700 dark:text-gray-100"
            />
            <button
              type="button"
              onClick={increaseQuantity}
              className="cursor-pointer px-3 py-2 text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-900"
              aria-label="Increase quantity"
            >
              +
            </button>
          </div>
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            Total: Rs {(Number(quickAdd.product.price) * quantity).toLocaleString()}
          </p>
        </div>

        <button
          type="button"
          onClick={handleAddToCart}
          className="w-full cursor-pointer rounded-xl bg-black py-3 font-medium text-white transition-colors hover:bg-gray-800"
        >
          Add to Cart
        </button>
        <button
          type="button"
          onClick={handleBuyNow}
          className="mt-2 w-full cursor-pointer rounded-xl border border-gray-300 py-3 font-medium text-gray-800 transition-colors hover:bg-gray-100 dark:border-gray-700 dark:text-gray-100 dark:hover:bg-gray-900"
        >
          Buy Now
        </button>
      </div>
    </div>,
    document.body
  );
}
