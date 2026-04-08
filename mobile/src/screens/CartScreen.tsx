import React from 'react';
import { Button, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { FeedbackBanner } from '../components/FeedbackBanner';
import { Screen } from '../components/Screen';
import { useCart } from '../context/CartContext';

type Props = NativeStackScreenProps<RootStackParamList, 'Cart'>;

export function CartScreen({ navigation }: Props) {
  const { cart, error, removeFromCart, updateQuantity, refreshCart } = useCart();

  if (!cart) return <Screen><Text>Loading cart…</Text></Screen>;

  return (
    <Screen>
      <Text style={{ fontSize: 24, fontWeight: '700' }}>Cart</Text>
      {error ? <FeedbackBanner message={error} tone="error" /> : null}
      <Text>Reserved until: {new Date(cart.inactivityExpiresAt).toLocaleTimeString()}</Text>
      <Button title="Refresh cart" onPress={refreshCart} />
      {cart.items.length === 0 ? <Text>Your cart is empty.</Text> : null}
      {cart.items.map((item) => (
        <View key={item.productId} style={{ borderWidth: 1, borderColor: '#ddd', borderRadius: 12, padding: 12, gap: 6 }}>
          <Text style={{ fontWeight: '600' }}>{item.name}</Text>
          <Text>Qty: {item.quantity}</Text>
          <Text>Line total: £{item.lineSubtotal.toFixed(2)}</Text>
          <Text>{item.stockAvailable} additional units available</Text>
          <Button title="Add one" onPress={() => updateQuantity(item.productId, item.quantity + 1)} />
          <Button title="Remove one" onPress={() => updateQuantity(item.productId, Math.max(item.quantity - 1, 0))} />
          <Button title="Remove item" onPress={() => removeFromCart(item.productId)} />
        </View>
      ))}
      <Text>Subtotal: £{cart.subtotal.toFixed(2)}</Text>
      <Text>Discounts: -£{cart.discountTotal.toFixed(2)}</Text>
      {cart.appliedDiscounts.map((discount) => (
        <Text key={discount.discountId}>• {discount.name}: -£{discount.amount.toFixed(2)}</Text>
      ))}
      <Text style={{ fontWeight: '700' }}>Total: £{cart.total.toFixed(2)}</Text>
      <Button title="Checkout" onPress={() => navigation.navigate('Checkout')} />
    </Screen>
  );
}
