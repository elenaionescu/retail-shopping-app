import { Module } from '@nestjs/common';
import { CatalogController } from './catalog/catalog.controller';
import { CatalogService } from './catalog/catalog.service';
import { DiscountsController } from './discounts/discounts.controller';
import { DiscountsService } from './discounts/discounts.service';
import { HealthController } from './health.controller';
import { CartsModule } from './carts/carts.module';

@Module({
  imports: [CartsModule],
  controllers: [HealthController, CatalogController, DiscountsController],
  providers: [CatalogService, DiscountsService],
})
export class AppModule {}