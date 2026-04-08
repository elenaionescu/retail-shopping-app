import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { CheckoutScreen } from '../src/screens/CheckoutScreen';

const checkout = jest.fn();
const clearCheckoutResult = jest.fn();

jest.mock('../src/context/CartContext', () => ({
  useCart: () => ({
    cart: {
      cartId: 'cart-1',
      status: 'ACTIVE',
      inactivityExpiresAt: new Date().toISOString(),
      items: [],
      subtotal: 20,
      discountTotal: 0,
      total: 20,
      appliedDiscounts: [],
    },
    checkout,
    clearCheckoutResult,
    error: null,
    checkoutResult: {
      orderId: 'ord_123',
      checkedOutAt: '2026-03-30T10:00:00.000Z',
      message: 'Checkout successful',
      summary: {
        cartId: 'cart-1',
        status: 'ACTIVE',
        inactivityExpiresAt: new Date().toISOString(),
        items: [],
        subtotal: 20,
        discountTotal: 0,
        total: 20,
        appliedDiscounts: [],
      },
    },
  }),
}));

describe('CheckoutScreen', () => {
  it('renders the successful checkout summary and supports dismissal', () => {
    const { getByText } = render(<CheckoutScreen />);
    expect(getByText('Checkout successful')).toBeTruthy();
    expect(getByText('Order ID: ord_123')).toBeTruthy();
    fireEvent.press(getByText('Dismiss'));
    expect(clearCheckoutResult).toHaveBeenCalled();
  });
});
