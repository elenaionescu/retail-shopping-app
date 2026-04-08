import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Pressable,
    SafeAreaView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import {
    addCartItem,
    Cart,
    createSession,
    getCart,
    getProducts,
    Product,
    removeCartItem,
    updateCartItem,
} from './api';

type Screen = 'products' | 'productDetail' | 'cart' | 'checkout';

export default function App() {
    const [screen, setScreen] = useState<Screen>('products');
    const [products, setProducts] = useState<Product[]>([]);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [selectedQuantity, setSelectedQuantity] = useState(1);
    const [cartId, setCartId] = useState<string | null>(null);
    const [cart, setCart] = useState<Cart | null>(null);

    const [loadingProducts, setLoadingProducts] = useState(true);
    const [productError, setProductError] = useState<string | null>(null);

    const [cartBusy, setCartBusy] = useState(false);
    const [cartError, setCartError] = useState<string | null>(null);

    useEffect(() => {
        void loadProducts();
    }, []);

    async function loadProducts() {
        try {
            setLoadingProducts(true);
            setProductError(null);
            const data = await getProducts();
            setProducts(data);
        } catch (err) {
            setProductError(err instanceof Error ? err.message : 'Unknown error');
        } finally {
            setLoadingProducts(false);
        }
    }

    async function ensureCart(): Promise<string> {
        if (cartId) {
            try {
                const existingCart = await getCart(cartId);
                setCart(existingCart);
                return existingCart.cartId;
            } catch {
                setCartId(null);
                setCart(null);
            }
        }

        const sessionCart = await createSession();

        if (!sessionCart?.cartId) {
            throw new Error('Failed to create cart session');
        }

        setCartId(sessionCart.cartId);
        setCart(sessionCart);

        return sessionCart.cartId;
    }

    function isCartExpiredError(error: unknown) {
        return (
            error instanceof Error &&
            /cart.*not found|expired/i.test(error.message)
        );
    }

    async function loadCart(existingCartId?: string) {
        try {
            setCartBusy(true);
            setCartError(null);

            const id = existingCartId ?? (await ensureCart());
            const nextCart = await getCart(id);

            setCart(nextCart);
            setCartId(nextCart.cartId);
        } catch (err) {
            setCartError(err instanceof Error ? err.message : 'Failed to load cart');
        } finally {
            setCartBusy(false);
        }
    }

    function openProductDetail(product: Product) {
        setSelectedProduct(product);
        setSelectedQuantity(1);
        setCartError(null);
        setScreen('productDetail');
    }

    function goBackToProducts() {
        setSelectedProduct(null);
        setSelectedQuantity(1);
        setCartError(null);
        setScreen('products');
    }

    function increaseQuantity() {
        if (!selectedProduct) return;
        setSelectedQuantity((current) =>
            Math.min(current + 1, Math.max(selectedProduct.stock, 1)),
        );
    }

    function decreaseQuantity() {
        setSelectedQuantity((current) => Math.max(current - 1, 1));
    }

    async function handleAddToCart() {
        if (!selectedProduct) return;

        try {
            setCartBusy(true);
            setCartError(null);

            let id = await ensureCart();
            console.log('USING CART ID:', id);

            try {
                const updatedCart = await addCartItem(id, selectedProduct.id, selectedQuantity);
                setCart(updatedCart);
                setCartId(updatedCart.cartId);
                setScreen('cart');
            } catch (err) {
                if (!isCartExpiredError(err)) {
                    throw err;
                }

                setCartId(null);
                setCart(null);

                id = await ensureCart();
                const updatedCart = await addCartItem(id, selectedProduct.id, selectedQuantity);

                setCart(updatedCart);
                setCartId(updatedCart.cartId);
                setScreen('cart');
            }
        } catch (err) {
            setCartError(err instanceof Error ? err.message : 'Failed to add item to cart');
        } finally {
            setCartBusy(false);
        }
    }

    async function handleCartQuantityChange(productId: string, quantity: number) {
        if (!cartId) return;

        try {
            setCartBusy(true);
            setCartError(null);

            const updatedCart =
                quantity <= 0
                    ? await removeCartItem(cartId, productId)
                    : await updateCartItem(cartId, productId, quantity);

            setCart(updatedCart);
            setCartId(updatedCart.cartId);
        } catch (err) {
            setCartError(err instanceof Error ? err.message : 'Failed to update cart');
        } finally {
            setCartBusy(false);
        }
    }

    async function handleRemoveFromCart(productId: string) {
        if (!cartId) return;

        try {
            setCartBusy(true);
            setCartError(null);

            const updatedCart = await removeCartItem(cartId, productId);
            setCart(updatedCart);
            setCartId(updatedCart.cartId);
        } catch (err) {
            setCartError(err instanceof Error ? err.message : 'Failed to remove item');
        } finally {
            setCartBusy(false);
        }
    }

    async function openCart() {
        setScreen('cart');
        await loadCart();
    }

    if (screen === 'productDetail' && selectedProduct) {
        const outOfStock = selectedProduct.stock <= 0;

        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <Pressable style={styles.secondaryButton} onPress={goBackToProducts}>
                        <Text style={styles.secondaryButtonText}>Back to Products</Text>
                    </Pressable>
                </View>

                <View style={styles.detailContainer}>
                    <Text style={styles.title}>{selectedProduct.name}</Text>
                    <Text style={styles.detailDescription}>{selectedProduct.description}</Text>

                    <View style={styles.detailCard}>
                        <Text style={styles.detailLabel}>Price</Text>
                        <Text style={styles.detailValue}>£{selectedProduct.price.toFixed(2)}</Text>

                        <Text style={styles.detailLabel}>Availability</Text>
                        <Text style={styles.detailValue}>
                            {outOfStock ? 'Out of stock' : `${selectedProduct.stock} in stock`}
                        </Text>
                    </View>

                    <View style={styles.quantitySection}>
                        <Text style={styles.quantityTitle}>Quantity</Text>

                        <View style={styles.quantityControls}>
                            <Pressable style={styles.quantityButton} onPress={decreaseQuantity}>
                                <Text style={styles.quantityButtonText}>−</Text>
                            </Pressable>

                            <View style={styles.quantityValueBox}>
                                <Text style={styles.quantityValue}>{selectedQuantity}</Text>
                            </View>

                            <Pressable
                                style={[
                                    styles.quantityButton,
                                    outOfStock || selectedQuantity >= selectedProduct.stock
                                        ? styles.quantityButtonDisabled
                                        : null,
                                ]}
                                onPress={increaseQuantity}
                                disabled={outOfStock || selectedQuantity >= selectedProduct.stock}
                            >
                                <Text style={styles.quantityButtonText}>+</Text>
                            </Pressable>
                        </View>
                    </View>

                    {cartError ? <Text style={styles.inlineError}>{cartError}</Text> : null}

                    <View style={styles.detailActions}>
                        <Pressable
                            style={[styles.button, outOfStock ? styles.buttonDisabled : null]}
                            disabled={outOfStock || cartBusy}
                            onPress={handleAddToCart}
                        >
                            <Text style={styles.buttonText}>
                                {cartBusy ? 'Adding...' : outOfStock ? 'Unavailable' : `Add ${selectedQuantity} to Cart`}
                            </Text>
                        </Pressable>
                    </View>
                </View>
            </SafeAreaView>
        );
    }

    if (screen === 'cart') {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <Text style={styles.title}>Cart</Text>
                    <Pressable style={styles.secondaryButton} onPress={() => setScreen('products')}>
                        <Text style={styles.secondaryButtonText}>Back to Products</Text>
                    </Pressable>
                </View>

                {cartBusy && !cart ? (
                    <View style={styles.centered}>
                        <ActivityIndicator size="large" />
                        <Text style={styles.subtitle}>Loading cart...</Text>
                    </View>
                ) : cartError ? (
                    <View style={styles.centered}>
                        <Text style={styles.errorTitle}>Cart error</Text>
                        <Text style={styles.errorText}>{cartError}</Text>
                        <Pressable style={styles.button} onPress={() => void loadCart()}>
                            <Text style={styles.buttonText}>Retry</Text>
                        </Pressable>
                    </View>
                ) : !cart || cart.items.length === 0 ? (
                    <View style={styles.centered}>
                        <Text style={styles.subtitle}>Your cart is empty</Text>
                    </View>
                ) : (
                    <>
                        <FlatList
                            data={cart.items}
                            keyExtractor={(item) => item.productId}
                            contentContainerStyle={styles.listContent}
                            renderItem={({ item }) => (
                                <View style={styles.card}>
                                    <Text style={styles.productName}>
                                        {'productName' in item && item.productName ? item.productName : item.productId}
                                    </Text>
                                    <Text style={styles.productDescription}>
                                        {'description' in item && item.description
                                            ? item.description
                                            : 'No description available'}
                                    </Text>
                                    <Text style={styles.price}>£{item.unitPrice.toFixed(2)}</Text>
                                    <Text style={styles.stock}>Qty: {item.quantity}</Text>
                                    <Text style={styles.stock}>Line total: £{item.lineTotal.toFixed(2)}</Text>

                                    <View style={styles.cartRow}>
                                        <Pressable
                                            style={styles.secondaryButton}
                                            onPress={() => void handleCartQuantityChange(item.productId, item.quantity - 1)}
                                        >
                                            <Text style={styles.secondaryButtonText}>−</Text>
                                        </Pressable>

                                        <Pressable
                                            style={styles.secondaryButton}
                                            onPress={() => void handleCartQuantityChange(item.productId, item.quantity + 1)}
                                        >
                                            <Text style={styles.secondaryButtonText}>+</Text>
                                        </Pressable>

                                        <Pressable
                                            style={styles.removeButton}
                                            onPress={() => void handleRemoveFromCart(item.productId)}
                                        >
                                            <Text style={styles.removeButtonText}>Remove</Text>
                                        </Pressable>
                                    </View>
                                </View>
                            )}
                        />

                        <View style={styles.summaryBox}>
                            <Text style={styles.summaryLine}>Subtotal: £{cart.subtotal.toFixed(2)}</Text>
                            <Text style={styles.summaryLine}>Discounts: -£{cart.discountTotal.toFixed(2)}</Text>
                            <Text style={styles.summaryTotal}>Total: £{cart.total.toFixed(2)}</Text>

                            <Pressable style={styles.button} onPress={() => setScreen('checkout')}>
                                <Text style={styles.buttonText}>Proceed to Checkout</Text>
                            </Pressable>
                        </View>
                    </>
                )}
            </SafeAreaView>
        );
    }

    if (screen === 'checkout') {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.centered}>
                    <Text style={styles.title}>Checkout</Text>
                    <Text style={styles.subtitle}>Next step: wire POST /cart/:cartId/checkout</Text>
                    <Pressable style={styles.button} onPress={() => setScreen('cart')}>
                        <Text style={styles.buttonText}>Back to Cart</Text>
                    </Pressable>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Products</Text>
                <Pressable style={styles.button} onPress={() => void openCart()}>
                    <Text style={styles.buttonText}>Go to Cart</Text>
                </Pressable>
            </View>

            {loadingProducts ? (
                <View style={styles.centered}>
                    <ActivityIndicator size="large" />
                    <Text style={styles.subtitle}>Loading products...</Text>
                </View>
            ) : productError ? (
                <View style={styles.centered}>
                    <Text style={styles.errorTitle}>Could not load products</Text>
                    <Text style={styles.errorText}>{String(productError)}</Text>
                    <Pressable style={styles.button} onPress={() => void loadProducts()}>
                        <Text style={styles.buttonText}>Retry</Text>
                    </Pressable>
                </View>
            ) : (
                <FlatList
                    data={products}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                        <View style={styles.card}>
                            <Text style={styles.productName}>{item.name}</Text>
                            <Text style={styles.productDescription}>
                                {item.description || 'No description available'}
                            </Text>
                            <Text style={styles.price}>£{item.price.toFixed(2)}</Text>
                            <Text style={styles.stock}>
                                {item.stock > 0 ? `In stock: ${item.stock}` : 'Out of stock'}
                            </Text>

                            <Pressable
                                style={styles.detailButton}
                                onPress={() => openProductDetail(item)}
                            >
                                <Text style={styles.detailButtonText}>View details</Text>
                            </Pressable>
                        </View>
                    )}
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#ffffff',
    },
    header: {
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 8,
        gap: 12,
    },
    centered: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
    },
    listContent: {
        padding: 16,
    },
    detailContainer: {
        flex: 1,
        padding: 16,
    },
    title: {
        fontSize: 28,
        fontWeight: '700',
        color: '#111111',
    },
    subtitle: {
        marginTop: 12,
        fontSize: 16,
        color: '#444444',
        textAlign: 'center',
    },
    card: {
        backgroundColor: '#f5f5f5',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
    },
    productName: {
        fontSize: 20,
        fontWeight: '600',
        color: '#111111',
        marginBottom: 8,
    },
    productDescription: {
        fontSize: 14,
        color: '#444444',
        marginBottom: 8,
    },
    price: {
        fontSize: 18,
        fontWeight: '700',
        color: '#111111',
        marginBottom: 4,
    },
    stock: {
        fontSize: 14,
        color: '#444444',
        marginBottom: 10,
    },
    linkText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#0a66c2',
    },
    detailDescription: {
        fontSize: 16,
        color: '#444444',
        marginTop: 12,
        marginBottom: 20,
    },
    detailCard: {
        backgroundColor: '#f5f5f5',
        borderRadius: 12,
        padding: 16,
        marginBottom: 24,
        gap: 8,
    },
    detailLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#666666',
    },
    detailValue: {
        fontSize: 18,
        color: '#111111',
        marginBottom: 8,
    },
    quantitySection: {
        marginBottom: 24,
    },
    quantityTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#111111',
        marginBottom: 12,
    },
    quantityControls: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    quantityButton: {
        width: 44,
        height: 44,
        borderRadius: 8,
        backgroundColor: '#111111',
        alignItems: 'center',
        justifyContent: 'center',
    },
    quantityButtonDisabled: {
        opacity: 0.4,
    },
    quantityButtonText: {
        color: '#ffffff',
        fontSize: 24,
        fontWeight: '700',
        lineHeight: 24,
    },
    quantityValueBox: {
        minWidth: 60,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 16,
    },
    quantityValue: {
        fontSize: 20,
        fontWeight: '600',
        color: '#111111',
    },
    detailActions: {
        marginTop: 'auto',
    },
    button: {
        alignSelf: 'flex-start',
        backgroundColor: '#111111',
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 8,
        marginTop: 8,
    },
    secondaryButton: {
        alignSelf: 'flex-start',
        backgroundColor: '#e9e9e9',
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 8,
        marginTop: 8,
    },
    secondaryButtonText: {
        color: '#111111',
        fontWeight: '600',
    },
    buttonDisabled: {
        opacity: 0.5,
    },
    buttonText: {
        color: '#ffffff',
        fontWeight: '600',
    },
    errorTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#b00020',
        marginBottom: 8,
        textAlign: 'center',
    },
    errorText: {
        fontSize: 15,
        color: '#333333',
        textAlign: 'center',
        marginBottom: 16,
    },
    inlineError: {
        color: '#b00020',
        marginBottom: 12,
        fontSize: 14,
    },
    cartRow: {
        marginTop: 12,
        gap: 12,
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    removeButton: {
        alignSelf: 'flex-start',
        backgroundColor: '#fff0f0',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
    },
    removeButtonText: {
        color: '#b00020',
        fontWeight: '600',
    },
    summaryBox: {
        borderTopWidth: 1,
        borderTopColor: '#dddddd',
        padding: 16,
        backgroundColor: '#ffffff',
    },
    summaryLine: {
        fontSize: 16,
        color: '#333333',
        marginBottom: 6,
    },
    summaryTotal: {
        fontSize: 20,
        fontWeight: '700',
        color: '#111111',
        marginBottom: 12,
    },
    detailButton: {
        alignSelf: 'flex-start',
        backgroundColor: '#0a66c2',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        marginTop: 8,
    },
    detailButtonText: {
        color: '#ffffff',
        fontWeight: '600',
    },
});