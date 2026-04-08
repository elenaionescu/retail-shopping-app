import { Test } from '@nestjs/testing';
import { CatalogService } from '../src/catalog/catalog.service';
import { CartsService, CART_TIMEOUT_MS } from '../src/carts/carts.service';
import { DiscountsService } from '../src/discounts/discounts.service';

describe('CartsService', () => {
  let service: CartsService;
  let catalogService: CatalogService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [CatalogService, DiscountsService, CartsService],
    }).compile();

    service = moduleRef.get(CartsService);
    catalogService = moduleRef.get(CatalogService);
    service.onModuleInit();
  });

  afterEach(() => {
    service.onModuleDestroy();
    jest.restoreAllMocks();
  });

  it('applies discounts during checkout summary', () => {
    const cart = service.createCart();
    service.addItem(cart.cartId, 'p-mug', 2);
    const updated = service.addItem(cart.cartId, 'p-headphones', 1);

    expect(updated.appliedDiscounts).toHaveLength(2);
    expect(updated.total).toBeCloseTo(136.99, 2);
  });

  it('decrements stock after successful checkout', () => {
    const cart = service.createCart();
    service.addItem(cart.cartId, 'p-tee', 2);
    const before = catalogService.getProduct('p-tee').stockOnHand;

    const order = service.checkout(cart.cartId);

    expect(order.message).toBe('Checkout successful');
    expect(catalogService.getProduct('p-tee').stockOnHand).toBe(before - 2);
  });

  it('prevents reserving more stock than available across carts', () => {
    const first = service.createCart();
    const second = service.createCart();

    service.addItem(first.cartId, 'p-headphones', 5);

    expect(() => service.addItem(second.cartId, 'p-headphones', 1)).toThrow('Only 0 units');
  });

  it('releases reservations when checkout fails', () => {
    const first = service.createCart();
    const second = service.createCart();

    service.addItem(first.cartId, 'p-headphones', 5);

    expect(() => service.checkout(second.cartId)).toThrow('Cart is empty');
    expect(() => service.addItem(first.cartId, 'p-headphones', 1)).toThrow('Only 0 units');
  });

  it('expires inactive carts and releases reservations', () => {
    const first = service.createCart();
    const second = service.createCart();

    service.addItem(first.cartId, 'p-headphones', 5);

    const expiredAt = new Date(Date.now() - CART_TIMEOUT_MS - 1).toISOString();
    const cartsMap = (service as unknown as { carts: Map<string, { lastActivityAt: string }> }).carts;
    const stored = cartsMap.get(first.cartId);
    if (!stored) throw new Error('Expected stored cart');
    stored.lastActivityAt = expiredAt;

    (service as unknown as { releaseExpiredReservations: () => void }).releaseExpiredReservations();

    expect(() => service.addItem(second.cartId, 'p-headphones', 5)).not.toThrow();
  });
});
