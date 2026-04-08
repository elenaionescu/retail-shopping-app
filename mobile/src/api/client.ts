import { Cart, CheckoutResult, Product } from '../types';

const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:3000/api';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers ?? {}),
    },
    ...options,
  });

  const json = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = json.message ?? 'Something went wrong';
    throw new Error(Array.isArray(message) ? message.join(', ') : message);
  }

  return json as T;
}

export const api = {
  createSession: async () => request<{ cart: Cart }>('/sessions', { method: 'POST' }),
  getProducts: async () => request<{ products: Product[] }>('/catalog/products'),
  getProduct: async (productId: string) => request<{ product: Product }>(`/catalog/products/${productId}`),
  getCart: async (cartId: string) => request<{ cart: Cart }>(`/cart/${cartId}`),
  addToCart: async (cartId: string, productId: string, quantity: number) =>
    request<{ cart: Cart }>(`/cart/${cartId}/items`, {
      method: 'POST',
      body: JSON.stringify({ productId, quantity }),
    }),
  updateCartItem: async (cartId: string, productId: string, quantity: number) =>
    request<{ cart: Cart }>(`/cart/${cartId}/items/${productId}`, {
      method: 'PATCH',
      body: JSON.stringify({ quantity }),
    }),
  removeCartItem: async (cartId: string, productId: string) =>
    request<{ cart: Cart }>(`/cart/${cartId}/items/${productId}`, { method: 'DELETE' }),
  checkout: async (cartId: string) => request<CheckoutResult>(`/cart/${cartId}/checkout`, { method: 'POST' }),
};
