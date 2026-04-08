import React from 'react';
import { render } from '@testing-library/react-native';
import { CartScreen } from '../src/screens/CartScreen';

jest.mock('../src/context/CartContext', () => ({
  useCart: () => ({
    cart: {
      cartId: 'cart-1',
      status: 'ACTIVE',
      inactivityExpiresAt: new Date().toISOString(),
      items: [
        {
          productId: 'p-tee',
          name: 'Classic Cotton T-Shirt',
          unitPrice: 24.99,
          quantity: 2,
          lineSubtotal: 49.98,
          stockAvailable: 10,
        },
      ],
      subtotal: 49.98,
      discountTotal: 5,
      total: 44.98,
      appliedDiscounts: [
        {
          discountId: 'discount-1',
          name: 'Promo',
          amount: 5,
          description: 'Promo discount',
        },
      ],
    },
    error: null,
    removeFromCart: jest.fn(),
    updateQuantity: jest.fn(),
    refreshCart: jest.fn(),
  }),
}));

describe('CartScreen', () => {
  it('renders running totals, discounts, and cart items', () => {
    const { getByText } = render(<CartScreen navigation={{ navigate: jest.fn() }} route={{ key: 'Cart', name: 'Cart' }} />);
    expect(getByText('Classic Cotton T-Shirt')).toBeTruthy();
    expect(getByText('Subtotal: £49.98')).toBeTruthy();
    expect(getByText('Discounts: -£5.00')).toBeTruthy();
    expect(getByText('• Promo: -£5.00')).toBeTruthy();
    expect(getByText('Total: £44.98')).toBeTruthy();
  });
});
