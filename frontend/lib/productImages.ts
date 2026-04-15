import { Product } from '@/lib/api';

function normalizeColorKey(value?: string) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-');
}

export function getColorImageUrl(product: Product, color?: string) {
  const colorImageMap = product.color_image_urls || product.color_images || {};
  if (!color || !Object.keys(colorImageMap).length) {
    return product.image_url;
  }

  const normalized = normalizeColorKey(color);
  return colorImageMap[normalized] || product.image_url;
}
