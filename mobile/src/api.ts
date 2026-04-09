export const API_BASE_URL = 'http://localhost:3000/api';

export type Product = {
    id: string;
    name: string;
    description: string;
    price: number;
    stock: number;
};

export type CartItem = {
    productId: string;
    productName: string;
    description: string;
    stock: number;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
};

export type AppliedDiscount = {
    code: string;
    description: string;
    amount: number;
};

export type Cart = {
    cartId: string;
    status?: string;
    inactivityExpiresAt?: string;
    items: CartItem[];
    subtotal: number;
    discountTotal: number;
    total: number;
    appliedDiscounts?: AppliedDiscount[];
};

export type CheckoutItem = {
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
};

export type CheckoutSummary = {
    orderId?: string;
    cartId?: string;
    items: CheckoutItem[];
    subtotal: number;
    discountTotal: number;
    total: number;
    appliedDiscounts?: AppliedDiscount[];
    message?: string;
};

function mapProduct(item: any): Product {
    return {
        id: String(item?.id ?? ''),
        name: item?.name ?? 'Unnamed product',
        description: item?.description ?? '',
        price: Number(item?.price ?? 0),
        stock: Number(
            item?.stock ??
            item?.availableToSell ??
            item?.availableStock ??
            item?.stockLevel ??
            item?.stock?.available ??
            0,
        ),
    };
}

function mapCartItem(item: any): CartItem {
    const nestedProduct = item?.product ?? {};

    const quantity = Number(item?.quantity ?? 0);
    const unitPrice = Number(
        item?.unitPrice ??
        item?.price ??
        nestedProduct?.price ??
        0,
    );

    return {
        productId: String(item?.productId ?? nestedProduct?.id ?? ''),
        productName:
            item?.productName ??
            nestedProduct?.name ??
            'Unnamed product',
        description:
            item?.description ??
            nestedProduct?.description ??
            '',
        stock: Number(
            item?.stock ??
            nestedProduct?.stock ??
            nestedProduct?.availableToSell ??
            0,
        ),
        quantity,
        unitPrice,
        lineTotal: Number(
            item?.lineTotal ??
            item?.total ??
            quantity * unitPrice,
        ),
    };
}

function mapAppliedDiscount(item: any): AppliedDiscount {
    return {
        code: String(item?.code ?? item?.id ?? 'DISCOUNT'),
        description: item?.description ?? item?.name ?? 'Discount',
        amount: Number(item?.amount ?? item?.value ?? 0),
    };
}

function unwrapCartPayload(data: any): any {
    return data?.cart ?? data;
}

function mapCart(rawInput: any): Cart {
    const raw = unwrapCartPayload(rawInput);

    const items = Array.isArray(raw?.items) ? raw.items.map(mapCartItem) : [];
    const appliedDiscounts = Array.isArray(raw?.appliedDiscounts)
        ? raw.appliedDiscounts.map(mapAppliedDiscount)
        : [];

    return {
        cartId: String(raw?.cartId ?? raw?.id ?? ''),
        status: raw?.status ?? 'ACTIVE',
        inactivityExpiresAt: raw?.inactivityExpiresAt ?? undefined,
        items,
        subtotal: Number(raw?.subtotal ?? 0),
        discountTotal: Number(raw?.discountTotal ?? raw?.discountsTotal ?? 0),
        total: Number(raw?.total ?? 0),
        appliedDiscounts,
    };
}

export async function getProducts(): Promise<Product[]> {
    const response = await fetch(`${API_BASE_URL}/catalog/products`);

    if (!response.ok) {
        throw new Error(`Failed to load products (${response.status})`);
    }

    const data = await response.json();

    const rawProducts = Array.isArray(data)
        ? data
        : Array.isArray(data?.products)
            ? data.products
            : Array.isArray(data?.items)
                ? data.items
                : [];

    return rawProducts.map(mapProduct);
}

export async function createSession(): Promise<Cart> {
    const response = await fetch(`${API_BASE_URL}/sessions`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
    });

    if (!response.ok) {
        const message = await safeErrorMessage(response);
        throw new Error(message || 'Failed to create cart session');
    }

    const data = await response.json();
    return mapCart(data);
}

export async function getCart(cartId: string): Promise<Cart> {
    const response = await fetch(`${API_BASE_URL}/cart/${cartId}`);

    if (!response.ok) {
        const message = await safeErrorMessage(response);
        throw new Error(message || `Failed to load cart (${response.status})`);
    }

    const data = await response.json();
    return mapCart(data);
}

export async function addCartItem(
    cartId: string,
    productId: string,
    quantity: number,
): Promise<Cart> {
    const response = await fetch(`${API_BASE_URL}/cart/${cartId}/items`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            productId,
            quantity,
        }),
    });

    if (!response.ok) {
        const message = await safeErrorMessage(response);
        throw new Error(message);
    }

    const data = await response.json();
    return mapCart(data);
}

export async function updateCartItem(
    cartId: string,
    productId: string,
    quantity: number,
): Promise<Cart> {
    const response = await fetch(`${API_BASE_URL}/cart/${cartId}/items/${productId}`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            quantity,
        }),
    });

    if (!response.ok) {
        const message = await safeErrorMessage(response);
        throw new Error(message);
    }

    const data = await response.json();
    return mapCart(data);
}

export async function removeCartItem(
    cartId: string,
    productId: string,
): Promise<Cart> {
    const response = await fetch(`${API_BASE_URL}/cart/${cartId}/items/${productId}`, {
        method: 'DELETE',
    });

    if (!response.ok) {
        const message = await safeErrorMessage(response);
        throw new Error(message);
    }

    const data = await response.json();
    return mapCart(data);
}

async function safeErrorMessage(response: Response): Promise<string> {
    try {
        const data = await response.json();
        return (
            data?.message ??
            data?.error ??
            `Request failed (${response.status})`
        );
    } catch {
        return `Request failed (${response.status})`;
    }
}

function mapCheckoutSummary(rawInput: any): CheckoutSummary {
    const raw = rawInput?.order ?? rawInput?.summary ?? rawInput;

    const items = Array.isArray(raw?.items)
        ? raw.items.map((item: any) => ({
            productId: String(item?.productId ?? item?.product?.id ?? ''),
            productName:
                item?.productName ??
                item?.product?.name ??
                'Unnamed product',
            quantity: Number(item?.quantity ?? 0),
            unitPrice: Number(item?.unitPrice ?? item?.price ?? item?.product?.price ?? 0),
            lineTotal: Number(
                item?.lineTotal ??
                item?.total ??
                Number(item?.quantity ?? 0) *
                Number(item?.unitPrice ?? item?.price ?? item?.product?.price ?? 0),
            ),
        }))
        : [];

    return {
        orderId: raw?.orderId ? String(raw.orderId) : undefined,
        cartId: raw?.cartId ? String(raw.cartId) : undefined,
        items,
        subtotal: Number(raw?.subtotal ?? 0),
        discountTotal: Number(raw?.discountTotal ?? 0),
        total: Number(raw?.total ?? 0),
        appliedDiscounts: Array.isArray(raw?.appliedDiscounts)
            ? raw.appliedDiscounts.map(mapAppliedDiscount)
            : [],
        message: rawInput?.message ?? raw?.message,
    };
}

export async function checkoutCart(cartId: string): Promise<CheckoutSummary> {
    const response = await fetch(`${API_BASE_URL}/cart/${cartId}/checkout`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
    });

    if (!response.ok) {
        const message = await safeErrorMessage(response);
        throw new Error(message || 'Checkout failed');
    }

    const data = await response.json();
    return mapCheckoutSummary(data);
}