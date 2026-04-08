import { Injectable, NotFoundException } from '@nestjs/common';
import { Product } from './catalog.types';

const SEEDED_PRODUCTS: Product[] = [
  {
    id: 'p-tee',
    name: 'Classic Cotton T-Shirt',
    description: 'A soft everyday tee in heavyweight cotton.',
    category: 'apparel',
    price: 24.99,
    stockOnHand: 12,
  },
  {
    id: 'p-hoodie',
    name: 'Zip Hoodie',
    description: 'Midweight zip hoodie with brushed fleece lining.',
    category: 'apparel',
    price: 54.99,
    stockOnHand: 8,
  },
  {
    id: 'p-mug',
    name: 'Stoneware Coffee Mug',
    description: 'Hand-finished 350ml mug.',
    category: 'home',
    price: 14.5,
    stockOnHand: 20,
  },
  {
    id: 'p-bag',
    name: 'Canvas Tote Bag',
    description: 'Large reusable tote with reinforced handles.',
    category: 'accessories',
    price: 18,
    stockOnHand: 16,
  },
  {
    id: 'p-headphones',
    name: 'Wireless Headphones',
    description: 'Bluetooth over-ear headphones with 20-hour battery.',
    category: 'electronics',
    price: 129.99,
    stockOnHand: 5,
  },
];

@Injectable()
export class CatalogService {
  private readonly products: Product[] = SEEDED_PRODUCTS.map((product) => ({ ...product }));

  listProducts() {
    return this.products.map((product) => ({ ...product }));
  }

  getProduct(productId: string) {
    const product = this.products.find((item) => item.id === productId);
    if (!product) {
      throw new NotFoundException(`Product ${productId} was not found`);
    }
    return { ...product };
  }

  decrementStock(productId: string, quantity: number) {
    const product = this.products.find((item) => item.id === productId);
    if (!product) {
      throw new NotFoundException(`Product ${productId} was not found`);
    }
    if (product.stockOnHand < quantity) {
      return false;
    }
    product.stockOnHand -= quantity;
    return true;
  }
}
