export interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  stockOnHand: number;
  availableToSell: number;
}

export interface AppliedDiscount {
  discountId: string;
  name: string;
  amount: number;
  description: string;
}

export interface CartItem {
  productId: string;
  name: string;
  unitPrice: number;
  quantity: number;
  lineSubtotal: number;
  stockAvailable: number;
}

export interface Cart {
  cartId: string;
  status: 'ACTIVE';
  inactivityExpiresAt: string;
  items: CartItem[];
  subtotal: number;
  discountTotal: number;
  total: number;
  appliedDiscounts: AppliedDiscount[];
}

export interface CheckoutResult {
  orderId: string;
  checkedOutAt: string;
  summary: Cart;
  message: string;
}
