import { AppliedDiscount } from '../discounts/discounts.types';

export interface CartItem {
  productId: string;
  quantity: number;
}

export interface Cart {
  id: string;
  createdAt: string;
  lastActivityAt: string;
  status: 'ACTIVE';
  items: CartItem[];
}

export interface CartSummaryItem {
  productId: string;
  name: string;
  unitPrice: number;
  quantity: number;
  lineSubtotal: number;
  stockAvailable: number;
}

export interface CartSummary {
  cartId: string;
  status: 'ACTIVE';
  inactivityExpiresAt: string;
  items: CartSummaryItem[];
  subtotal: number;
  discountTotal: number;
  total: number;
  appliedDiscounts: AppliedDiscount[];
}

export interface CheckoutResult {
  orderId: string;
  checkedOutAt: string;
  summary: CartSummary;
  message: string;
}
