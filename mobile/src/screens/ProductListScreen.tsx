import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Button, Pressable, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { api } from '../api/client';
import { FeedbackBanner } from '../components/FeedbackBanner';
import { Screen } from '../components/Screen';
import { useCart } from '../context/CartContext';
import { Product } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'Products'>;

export function ProductListScreen({ navigation }: Props) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { addToCart, cart, error: cartError } = useCart();

  useEffect(() => {
    (async () => {
      try {
        const result = await api.getProducts();
        setProducts(result.products);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load products');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <ActivityIndicator style={{ marginTop: 48 }} />;
  if (error) return <Screen><FeedbackBanner message={error} tone="error" /></Screen>;

  return (
    <Screen>
      <Text style={styles.heading}>Product Catalogue</Text>
      {cartError ? <FeedbackBanner message={cartError} tone="error" /> : null}
      {products.map((product) => (
        <Pressable
          key={product.id}
          onPress={() => navigation.navigate('ProductDetail', { productId: product.id })}
          style={styles.card}
        >
          <Text style={styles.title}>{product.name}</Text>
          <Text>£{product.price.toFixed(2)}</Text>
          <Text>{product.availableToSell} available now</Text>
          <Button title="Add to cart" onPress={() => addToCart(product.id)} />
        </Pressable>
      ))}
      <View style={styles.footer}>
        <Button title={`Cart (${cart?.items.length ?? 0})`} onPress={() => navigation.navigate('Cart')} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  heading: { fontSize: 24, fontWeight: '700' },
  title: { fontSize: 18, fontWeight: '600' },
  card: { borderWidth: 1, borderColor: '#ddd', borderRadius: 12, padding: 16, gap: 8 },
  footer: { marginTop: 8 },
});
