export interface Discount {
  id: string;
  name: string;
  description: string;
  type: 'order_percentage' | 'buy_x_get_y';
  active: boolean;
}

export interface AppliedDiscount {
  discountId: string;
  name: string;
  amount: number;
  description: string;
}
