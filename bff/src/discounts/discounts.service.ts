import { Injectable, NotFoundException } from '@nestjs/common';
import { Discount, AppliedDiscount } from './discounts.types';

export interface PricingLineItem {
  productId: string;
  name: string;
  unitPrice: number;
  quantity: number;
  lineSubtotal: number;
}

const SEEDED_DISCOUNTS: Discount[] = [
  {
    id: 'd-order-10-over-100',
    name: '10% off orders over £100',
    description: 'Applies 10% off the cart subtotal once the basket reaches £100.',
    type: 'order_percentage',
    active: true,
  },
  {
    id: 'd-mug-2-for-20',
    name: '2 mugs for £20',
    description: 'Each pair of Stoneware Coffee Mugs is priced at £20.',
    type: 'buy_x_get_y',
    active: true,
  },
];

@Injectable()
export class DiscountsService {
  private readonly discounts: Discount[] = SEEDED_DISCOUNTS.map((discount) => ({ ...discount }));

  listDiscounts() {
    return this.discounts.filter((discount) => discount.active).map((discount) => ({ ...discount }));
  }

  getDiscount(discountId: string) {
    const discount = this.discounts.find((item) => item.id === discountId);
    if (!discount) {
      throw new NotFoundException(`Discount ${discountId} was not found`);
    }
    return { ...discount };
  }

  calculatePricing(lines: PricingLineItem[]): {
    appliedDiscounts: AppliedDiscount[];
    subtotal: number;
    discountTotal: number;
    total: number;
  } {
    const subtotal = Number(lines.reduce((sum, line) => sum + line.lineSubtotal, 0).toFixed(2));
    const appliedDiscounts: AppliedDiscount[] = [];

    const mugLine = lines.find((line) => line.productId === 'p-mug');
    if (mugLine && mugLine.quantity >= 2) {
      const pairs = Math.floor(mugLine.quantity / 2);
      const fullPrice = pairs * 2 * mugLine.unitPrice;
      const promoPrice = pairs * 20;
      const amount = Number((fullPrice - promoPrice).toFixed(2));
      if (amount > 0) {
        appliedDiscounts.push({
          discountId: 'd-mug-2-for-20',
          name: '2 mugs for £20',
          amount,
          description: 'Bundle pricing applied to Stoneware Coffee Mugs.',
        });
      }
    }

    const subtotalAfterLineDiscounts = subtotal - appliedDiscounts.reduce((sum, discount) => sum + discount.amount, 0);
    if (subtotalAfterLineDiscounts >= 100) {
      const amount = Number((subtotalAfterLineDiscounts * 0.1).toFixed(2));
      appliedDiscounts.push({
        discountId: 'd-order-10-over-100',
        name: '10% off orders over £100',
        amount,
        description: 'Automatic order-level discount.',
      });
    }

    const discountTotal = Number(appliedDiscounts.reduce((sum, discount) => sum + discount.amount, 0).toFixed(2));
    const total = Number((subtotal - discountTotal).toFixed(2));

    return {
      appliedDiscounts,
      subtotal,
      discountTotal,
      total,
    };
  }
}
