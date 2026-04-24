export interface Product {
  id: number;
  name: string;
  description: string;
  image_url: string;
  color_images?: Record<string, string>;
  color_image_urls?: Record<string, string>;
  gallery_image_urls?: { id: number; url: string; alt_text: string; display_order: number }[];
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
  coupon_code?: string;
  items: OrderItem[];
}

export interface ShippingConfig {
  flat_shipping_fee: string;
  free_shipping_threshold: string;
}

export interface AuthUser {
  id: number;
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
}

export interface Order {
  id: number;
  user: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  payment_mode: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  status: string;
  payment_status: string;
  payment_reference?: string;
  subtotal_amount: string;
  shipping_fee: string;
  discount_amount: string;
  coupon_code?: string;
  total_amount: string;
  paid_at?: string;
  items: {
    product: number;
    product_name: string;
    product_image_url: string;
    price: string;
    quantity: number;
    size?: string;
    color?: string;
  }[];
  created_at: string;
}

const ENV_API_BASE = process.env.NEXT_PUBLIC_API_URL;

function unique(values: string[]) {
  return [...new Set(values.filter(Boolean))];
}

function getApiBases() {
  const currentHost = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
  return unique([
    ENV_API_BASE || '',
    `http://${currentHost}:8000/api`,
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
  const idempotencyKey =
    (typeof globalThis !== 'undefined' && globalThis.crypto?.randomUUID?.()) ||
    `order-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  const bases = getApiBases();
  let lastError: unknown = null;

  for (const base of bases) {
    try {
      const res = await fetch(`${base}/orders/create/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': idempotencyKey,
        },
        credentials: 'include',
        body: JSON.stringify({
          ...data,
          idempotency_key: idempotencyKey,
        }),
      });
      if (!res.ok) {
        let message = 'Order creation failed';
        try {
          const payload = await res.json();
          message = payload.detail || payload.items || message;
        } catch {
          const err = await res.text();
          message = err || message;
        }
        throw new Error(message);
      }
      return res.json();
    } catch (err) {
      lastError = err;
    }
  }

  throw lastError instanceof Error ? lastError : new Error('Order creation failed');
}

export async function signupWithPassword(input: {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
}): Promise<{ detail: string; user: AuthUser }> {
  const bases = getApiBases();
  let lastError: unknown = null;

  for (const base of bases) {
    try {
      const res = await fetch(`${base}/auth/signup/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(input),
      });
      if (!res.ok) {
        let message = 'Signup failed';
        try {
          const data = await res.json();
          message = data.detail || message;
        } catch {
          const err = await res.text();
          message = err || message;
        }
        throw new Error(message);
      }
      return res.json();
    } catch (err) {
      lastError = err;
    }
  }

  throw lastError instanceof Error ? lastError : new Error('Signup failed');
}

export async function loginWithPassword(input: {
  email: string;
  password: string;
}): Promise<{ detail: string; user: AuthUser }> {
  const bases = getApiBases();
  let lastError: unknown = null;

  for (const base of bases) {
    try {
      const res = await fetch(`${base}/auth/login-password/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(input),
      });
      if (!res.ok) {
        let message = 'Login failed';
        try {
          const data = await res.json();
          message = data.detail || message;
        } catch {
          const err = await res.text();
          message = err || message;
        }
        throw new Error(message);
      }
      return res.json();
    } catch (err) {
      lastError = err;
    }
  }

  throw lastError instanceof Error ? lastError : new Error('Login failed');
}

export async function fetchShippingConfig(): Promise<ShippingConfig> {
  const bases = getApiBases();
  let lastError: unknown = null;

  for (const base of bases) {
    try {
      const res = await fetch(`${base}/shipping/config/`, { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to fetch shipping config');
      return res.json();
    } catch (err) {
      lastError = err;
    }
  }

  throw lastError instanceof Error ? lastError : new Error('Failed to fetch shipping config');
}

export async function validateCoupon(input: {
  code: string;
  email: string;
  subtotal: number;
}): Promise<{ valid: boolean; code: string; discount_percent: number; discount_amount: string }> {
  const bases = getApiBases();
  let lastError: unknown = null;

  for (const base of bases) {
    try {
      const res = await fetch(`${base}/coupons/validate/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      if (!res.ok) {
        let message = 'Coupon validation failed';
        try {
          const data = await res.json();
          message = data.detail || message;
        } catch {
          const err = await res.text();
          message = err || message;
        }
        throw new Error(message);
      }
      return res.json();
    } catch (err) {
      lastError = err;
    }
  }

  throw lastError instanceof Error ? lastError : new Error('Coupon validation failed');
}

export async function requestEmailOtp(email: string) {
  const bases = getApiBases();
  let lastError: unknown = null;

  for (const base of bases) {
    try {
      const res = await fetch(`${base}/auth/request-otp/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        let message = 'Failed to send OTP';
        try {
          const data = await res.json();
          message = data.detail || message;
        } catch {
          const err = await res.text();
          message = err || message;
        }
        throw new Error(message);
      }
      return res.json();
    } catch (err) {
      lastError = err;
    }
  }

  throw lastError instanceof Error ? lastError : new Error('Failed to send OTP');
}

export async function verifyEmailOtp(email: string, otp: string): Promise<{ detail: string; user: AuthUser }> {
  const bases = getApiBases();
  let lastError: unknown = null;

  for (const base of bases) {
    try {
      const res = await fetch(`${base}/auth/verify-otp/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, otp }),
      });
      if (!res.ok) {
        let message = 'OTP verification failed';
        try {
          const data = await res.json();
          message = data.detail || message;
        } catch {
          const err = await res.text();
          message = err || message;
        }
        throw new Error(message);
      }
      return res.json();
    } catch (err) {
      lastError = err;
    }
  }

  throw lastError instanceof Error ? lastError : new Error('OTP verification failed');
}

export async function updatePassword(input: {
  email: string;
  current_password: string;
  new_password: string;
  confirm_password: string;
}): Promise<{ detail: string }> {
  const bases = getApiBases();
  let lastError: unknown = null;

  for (const base of bases) {
    try {
      const res = await fetch(`${base}/auth/update-password/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(input),
      });
      if (!res.ok) {
        let message = 'Password update failed';
        try {
          const data = await res.json();
          message = data.detail || message;
        } catch {
          const err = await res.text();
          message = err || message;
        }
        throw new Error(message);
      }
      return res.json();
    } catch (err) {
      lastError = err;
    }
  }

  throw lastError instanceof Error ? lastError : new Error('Password update failed');
}

export async function fetchOrders(): Promise<Order[]> {
  const bases = getApiBases();
  let lastError: unknown = null;

  for (const base of bases) {
    try {
      const res = await fetch(`${base}/orders/`, {
        cache: 'no-store',
        credentials: 'include',
      });
      if (!res.ok) throw new Error(`Failed to fetch orders (${res.status})`);
      return res.json();
    } catch (err) {
      lastError = err;
    }
  }

  throw lastError instanceof Error ? lastError : new Error('Failed to fetch orders');
}

export async function fetchWishlist(): Promise<{ id: number; product: Product; product_id: number; created_at: string }[]> {
  const bases = getApiBases();
  let lastError: unknown = null;

  for (const base of bases) {
    try {
      const res = await fetch(`${base}/wishlist/`, {
        cache: 'no-store',
        credentials: 'include',
      });
      if (!res.ok) throw new Error(`Failed to fetch wishlist (${res.status})`);
      return res.json();
    } catch (err) {
      lastError = err;
    }
  }

  throw lastError instanceof Error ? lastError : new Error('Failed to fetch wishlist');
}

export async function addToWishlist(productId: number): Promise<void> {
  const bases = getApiBases();
  let lastError: unknown = null;

  for (const base of bases) {
    try {
      const res = await fetch(`${base}/wishlist/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ product_id: productId }),
      });
      if (!res.ok) throw new Error(`Failed to add to wishlist (${res.status})`);
      return;
    } catch (err) {
      lastError = err;
    }
  }

  throw lastError instanceof Error ? lastError : new Error('Failed to add to wishlist');
}

export async function removeFromWishlist(productId: number): Promise<void> {
  const bases = getApiBases();
  let lastError: unknown = null;

  for (const base of bases) {
    try {
      const res = await fetch(`${base}/wishlist/${productId}/`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok && res.status !== 404) throw new Error(`Failed to remove from wishlist (${res.status})`);
      return;
    } catch (err) {
      lastError = err;
    }
  }

  throw lastError instanceof Error ? lastError : new Error('Failed to remove from wishlist');
}
