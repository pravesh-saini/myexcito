export interface Product {
  id: number;
  name: string;
  description: string;
  image_url: string;
  price: number;
  original_price?: number | null;
  category: string;
  section: string;
  brand: string;
  colors: string[];
  sizes: string[];
  is_new: boolean;
  on_sale: boolean;
  is_limited_stock: boolean;
  stock_count: number;
  discount?: number | null;
}

export interface OrderItem {
  product: number;
  quantity: number;
  size?: string;
  color?: string;
}

export interface OrderData {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  payment_mode?: 'cod' | 'upi' | 'card';
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  items: OrderItem[];
}

const ENV_API_BASE = process.env.NEXT_PUBLIC_API_URL;

function unique(values: string[]) {
  return [...new Set(values.filter(Boolean))];
}

function getApiBases() {
  return unique([
    ENV_API_BASE || '',
    'http://127.0.0.1:8000/api',
    'http://localhost:8000/api',
  ]);
}

export async function fetchProducts(params: { category?: string } = {}): Promise<Product[]> {
  const bases = getApiBases();
  let lastError: unknown = null;

  for (const base of bases) {
    try {
      const url = new URL(`${base}/products/`);
      if (params.category) url.searchParams.append('category', params.category);
      const res = await fetch(url.toString(), { cache: 'no-store' });
      if (!res.ok) throw new Error(`Failed to fetch products (${res.status})`);
      return res.json();
    } catch (err) {
      lastError = err;
    }
  }

  throw lastError instanceof Error ? lastError : new Error('Failed to fetch products');
}

export async function createOrder(data: OrderData) {
  const bases = getApiBases();
  let lastError: unknown = null;

  for (const base of bases) {
    try {
      const res = await fetch(`${base}/orders/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.text();
        throw new Error(err || 'Order creation failed');
      }
      return res.json();
    } catch (err) {
      lastError = err;
    }
  }

  throw lastError instanceof Error ? lastError : new Error('Order creation failed');
}
