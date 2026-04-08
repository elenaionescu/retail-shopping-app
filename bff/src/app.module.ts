import { Module } from '@nestjs/common';
import { CatalogController } from './catalog/catalog.controller';
import { CatalogService } from './catalog/catalog.service';
import { DiscountsController } from './discounts/discounts.controller';
import { DiscountsService } from './discounts/discounts.service';
import { CartsController } from './carts/carts.controller';
import { CartsService } from './carts/carts.service';
import { HealthController } from './health.controller';

@Module({
  imports: [],
  controllers: [HealthController, CatalogController, DiscountsController, CartsController],
  providers: [CatalogService, DiscountsService, CartsService],
})
export class AppModule {}
