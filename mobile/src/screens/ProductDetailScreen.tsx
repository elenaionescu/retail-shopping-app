import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Button, Text } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { api } from '../api/client';
import { FeedbackBanner } from '../components/FeedbackBanner';
import { Screen } from '../components/Screen';
import { useCart } from '../context/CartContext';
import { Product } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'ProductDetail'>;

export function ProductDetailScreen({ route, navigation }: Props) {
  const { productId } = route.params;
  const [product, setProduct] = useState<Product | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { addToCart, error: cartError } = useCart();

  useEffect(() => {
    (async () => {
      try {
        const result = await api.getProduct(productId);
        setProduct(result.product);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load product');
      }
    })();
  }, [productId]);

  if (error) return <Screen><FeedbackBanner message={error} tone="error" /></Screen>;
  if (!product) return <ActivityIndicator style={{ marginTop: 48 }} />;

  return (
    <Screen>
      <Text style={{ fontSize: 24, fontWeight: '700' }}>{product.name}</Text>
      {cartError ? <FeedbackBanner message={cartError} tone="error" /> : null}
      <Text>{product.description}</Text>
      <Text>Category: {product.category}</Text>
      <Text>Price: £{product.price.toFixed(2)}</Text>
      <Text>{product.availableToSell} available now</Text>
      <Button title="Add to cart" onPress={() => addToCart(product.id)} />
      <Button title="Go to cart" onPress={() => navigation.navigate('Cart')} />
    </Screen>
  );
}
