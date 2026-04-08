export type ProductCategory = 'apparel' | 'home' | 'accessories' | 'electronics';

export interface Product {
  id: string;
  name: string;
  description: string;
  category: ProductCategory;
  price: number;
  stockOnHand: number;
}

export interface ProductView extends Product {
  availableToSell: number;
}
