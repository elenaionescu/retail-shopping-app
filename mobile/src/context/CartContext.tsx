import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../api/client';
import { Cart, CheckoutResult } from '../types';

interface CartContextValue {
  cart: Cart | null;
  loading: boolean;
  error: string | null;
  checkoutResult: CheckoutResult | null;
  addToCart: (productId: string, quantity?: number) => Promise<void>;
  updateQuantity: (productId: string, quantity: number) => Promise<void>;
  removeFromCart: (productId: string) => Promise<void>;
  refreshCart: () => Promise<void>;
  checkout: () => Promise<void>;
  clearCheckoutResult: () => void;
  clearError: () => void;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

export const CartProvider = ({ children }: React.PropsWithChildren) => {
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [checkoutResult, setCheckoutResult] = useState<CheckoutResult | null>(null);

  const createFreshSession = useCallback(async () => {
    const result = await api.createSession();
    setCart(result.cart);
    return result.cart;
  }, []);

  useEffect(() => {
    (async () => {
      try {
        await createFreshSession();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to create session');
      } finally {
        setLoading(false);
      }
    })();
  }, [createFreshSession]);

  const withCart = useCallback(async (fn: (cartId: string) => Promise<unknown>) => {
    if (!cart) {
      throw new Error('Cart not loaded yet');
    }

    setError(null);

    try {
      return await fn(cart.cartId);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Something went wrong';
      setError(message);
      throw err;
    }
  }, [cart]);

  const addToCart = useCallback(async (productId: string, quantity = 1) => {
    const result = (await withCart((cartId) => api.addToCart(cartId, productId, quantity))) as { cart: Cart };
    setCart(result.cart);
  }, [withCart]);

  const updateQuantity = useCallback(async (productId: string, quantity: number) => {
    const result = (await withCart((cartId) => api.updateCartItem(cartId, productId, quantity))) as { cart: Cart };
    setCart(result.cart);
  }, [withCart]);

  const removeFromCart = useCallback(async (productId: string) => {
    const result = (await withCart((cartId) => api.removeCartItem(cartId, productId))) as { cart: Cart };
    setCart(result.cart);
  }, [withCart]);

  const refreshCart = useCallback(async () => {
    if (!cart) return;

    try {
      const result = await api.getCart(cart.cartId);
      setCart(result.cart);
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to refresh cart';
      setError(message);

      if (message.includes('expired')) {
        await createFreshSession();
      }
    }
  }, [cart, createFreshSession]);

  const checkout = useCallback(async () => {
    try {
      const result = (await withCart((cartId) => api.checkout(cartId))) as CheckoutResult;
      setCheckoutResult(result);
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Checkout failed';
      setError(message);
    } finally {
      await createFreshSession();
    }
  }, [withCart, createFreshSession]);

  const value = useMemo(() => ({
    cart,
    loading,
    error,
    checkoutResult,
    addToCart,
    updateQuantity,
    removeFromCart,
    refreshCart,
    checkout,
    clearCheckoutResult: () => setCheckoutResult(null),
    clearError: () => setError(null),
  }), [cart, loading, error, checkoutResult, addToCart, updateQuantity, removeFromCart, refreshCart, checkout]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within CartProvider');
  return context;
};
