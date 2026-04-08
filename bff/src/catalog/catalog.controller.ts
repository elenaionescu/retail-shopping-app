import { Controller, Get, Param } from '@nestjs/common';
import { CatalogService } from './catalog.service';
import { CartsService } from '../carts/carts.service';

@Controller('api/catalog/products')
export class CatalogController {
  constructor(
    private readonly catalogService: CatalogService,
    private readonly cartsService: CartsService,
  ) {}

  @Get()
  listProducts() {
    return {
      products: this.catalogService.listProducts().map((product) => ({
        ...product,
        availableToSell: this.cartsService.getAvailableStock(product.id),
      })),
    };
  }

  @Get(':productId')
  getProduct(@Param('productId') productId: string) {
    const product = this.catalogService.getProduct(productId);
    return {
      product: {
        ...product,
        availableToSell: this.cartsService.getAvailableStock(productId),
      },
    };
  }
}
