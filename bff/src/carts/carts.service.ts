import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { CatalogService } from '../catalog/catalog.service';
import { DiscountsService } from '../discounts/discounts.service';
import { Cart, CartSummary, CheckoutResult } from './cart.types';

export const CART_TIMEOUT_MS = 2 * 60 * 1000;

@Injectable()
export class CartsService implements OnModuleInit, OnModuleDestroy {
  private readonly carts = new Map<string, Cart>();
  private releaseTimer?: NodeJS.Timeout;

  constructor(
    private readonly catalogService: CatalogService,
    private readonly discountsService: DiscountsService,
  ) {}

  onModuleInit() {
    this.releaseTimer = setInterval(() => this.releaseExpiredReservations(), 5_000);
  }

  onModuleDestroy() {
    if (this.releaseTimer) {
      clearInterval(this.releaseTimer);
    }
  }

  createCart() {
    const now = new Date().toISOString();
    const cart: Cart = {
      id: randomUUID(),
      createdAt: now,
      lastActivityAt: now,
      status: 'ACTIVE',
      items: [],
    };
    this.carts.set(cart.id, cart);
    return this.toSummary(cart);
  }

  getCart(cartId: string) {
    return this.toSummary(this.getActiveCartOrThrow(cartId));
  }

  addItem(cartId: string, productId: string, quantity: number) {
    const cart = this.getActiveCartOrThrow(cartId);
    const existing = cart.items.find((item) => item.productId === productId);
    const nextQuantity = (existing?.quantity ?? 0) + quantity;
    this.ensureStockAvailable(cart, productId, nextQuantity);

    if (existing) {
      existing.quantity = nextQuantity;
    } else {
      cart.items.push({ productId, quantity });
    }

    this.touch(cart);
    return this.toSummary(cart);
  }

  updateItem(cartId: string, productId: string, quantity: number) {
    const cart = this.getActiveCartOrThrow(cartId);
    const item = cart.items.find((entry) => entry.productId === productId);
    if (!item) {
      throw new NotFoundException(`Product ${productId} is not in the cart`);
    }

    if (quantity === 0) {
      cart.items = cart.items.filter((entry) => entry.productId !== productId);
    } else {
      this.ensureStockAvailable(cart, productId, quantity);
      item.quantity = quantity;
    }

    this.touch(cart);
    return this.toSummary(cart);
  }

  removeItem(cartId: string, productId: string) {
    const cart = this.getActiveCartOrThrow(cartId);
    cart.items = cart.items.filter((entry) => entry.productId !== productId);
    this.touch(cart);
    return this.toSummary(cart);
  }

  checkout(cartId: string): CheckoutResult {
    const cart = this.getActiveCartOrThrow(cartId);

    if (cart.items.length === 0) {
      this.carts.delete(cartId);
      throw new BadRequestException('Cart is empty');
    }

    try {
      for (const item of cart.items) {
        this.ensureStockAvailable(cart, item.productId, item.quantity);
      }

      const summary = this.toSummary(cart);

      for (const item of cart.items) {
        const ok = this.catalogService.decrementStock(item.productId, item.quantity);
        if (!ok) {
          throw new ConflictException(`Insufficient stock for ${item.productId}`);
        }
      }

      return {
        orderId: `ord_${randomUUID()}`,
        checkedOutAt: new Date().toISOString(),
        summary,
        message: 'Checkout successful',
      };
    } finally {
      this.carts.delete(cartId);
    }
  }

  getAvailableStock(productId: string, excludingCartId?: string) {
    const product = this.catalogService.getProduct(productId);
    const reserved = this.getReservedQuantity(productId, excludingCartId);
    return Math.max(product.stockOnHand - reserved, 0);
  }

  private getActiveCartOrThrow(cartId: string) {
    const cart = this.carts.get(cartId);
    if (!cart) {
      throw new NotFoundException(`Cart ${cartId} was not found or expired`);
    }
    if (this.isExpired(cart)) {
      this.carts.delete(cart.id);
      throw new NotFoundException(`Cart ${cartId} was not found or expired`);
    }
    return cart;
  }

  private touch(cart: Cart) {
    cart.lastActivityAt = new Date().toISOString();
  }

  private isExpired(cart: Cart) {
    return Date.now() - new Date(cart.lastActivityAt).getTime() >= CART_TIMEOUT_MS;
  }

  private releaseExpiredReservations() {
    for (const cart of this.carts.values()) {
      if (this.isExpired(cart)) {
        this.carts.delete(cart.id);
      }
    }
  }

  private getReservedQuantity(productId: string, excludingCartId?: string) {
    let reserved = 0;
    for (const cart of this.carts.values()) {
      if ((excludingCartId && cart.id === excludingCartId) || this.isExpired(cart)) {
        continue;
      }
      const item = cart.items.find((entry) => entry.productId === productId);
      reserved += item?.quantity ?? 0;
    }
    return reserved;
  }

  private ensureStockAvailable(cart: Cart, productId: string, desiredQuantity: number) {
    const product = this.catalogService.getProduct(productId);
    const availableForCart = this.getAvailableStock(productId, cart.id);
    if (desiredQuantity > availableForCart) {
      throw new ConflictException(
        `Only ${Math.max(availableForCart, 0)} units of ${product.name} are available`,
      );
    }
  }

  private toSummary(cart: Cart): CartSummary {
    const lines = cart.items.map((item) => {
      const product = this.catalogService.getProduct(item.productId);
      return {
        productId: product.id,
        name: product.name,
        unitPrice: product.price,
        quantity: item.quantity,
        lineSubtotal: Number((product.price * item.quantity).toFixed(2)),
        stockAvailable: this.getAvailableStock(product.id, cart.id),
      };
    });

    const pricing = this.discountsService.calculatePricing(lines);

    return {
      cartId: cart.id,
      status: 'ACTIVE',
      inactivityExpiresAt: new Date(new Date(cart.lastActivityAt).getTime() + CART_TIMEOUT_MS).toISOString(),
      items: lines,
      subtotal: pricing.subtotal,
      discountTotal: pricing.discountTotal,
      total: pricing.total,
      appliedDiscounts: pricing.appliedDiscounts,
    };
  }
}
