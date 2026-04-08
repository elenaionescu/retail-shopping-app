import { Controller, Get, Param } from '@nestjs/common';
import { DiscountsService } from './discounts.service';

@Controller('api/discounts')
export class DiscountsController {
  constructor(private readonly discountsService: DiscountsService) {}

  @Get()
  listDiscounts() {
    return { discounts: this.discountsService.listDiscounts() };
  }

  @Get(':discountId')
  getDiscount(@Param('discountId') discountId: string) {
    return { discount: this.discountsService.getDiscount(discountId) };
  }
}
