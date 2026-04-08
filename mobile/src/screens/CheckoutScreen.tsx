import React from 'react';
import { Button, Text } from 'react-native';
import { FeedbackBanner } from '../components/FeedbackBanner';
import { Screen } from '../components/Screen';
import { useCart } from '../context/CartContext';

export function CheckoutScreen() {
  const { cart, checkout, checkoutResult, clearCheckoutResult, error } = useCart();

  return (
    <Screen>
      <Text style={{ fontSize: 24, fontWeight: '700' }}>Checkout</Text>
      {checkoutResult ? (
        <>
          <FeedbackBanner message={checkoutResult.message} tone="success" />
          <Text>Order ID: {checkoutResult.orderId}</Text>
          <Text>Total paid: £{checkoutResult.summary.total.toFixed(2)}</Text>
          <Text>Checked out at: {new Date(checkoutResult.checkedOutAt).toLocaleString()}</Text>
          <Button title="Dismiss" onPress={clearCheckoutResult} />
        </>
      ) : (
        <>
          {error ? <FeedbackBanner message={error} tone="error" /> : null}
          <Text>Total due: £{cart?.total.toFixed(2) ?? '0.00'}</Text>
          <Text>Checkout is simulated and does not use a real payment provider.</Text>
          <Button title="Complete checkout" onPress={checkout} />
        </>
      )}
    </Screen>
  );
}
