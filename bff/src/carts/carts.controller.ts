import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { CartsService } from './carts.service';
import { AddCartItemDto, UpdateCartItemDto } from './dto';

@Controller('api')
export class CartsController {
  constructor(private readonly cartsService: CartsService) {}

  @Post('sessions')
  createSession() {
    return { cart: this.cartsService.createCart() };
  }

  @Get('cart/:cartId')
  getCart(@Param('cartId') cartId: string) {
    return { cart: this.cartsService.getCart(cartId) };
  }

  @Post('cart/:cartId/items')
  addItem(@Param('cartId') cartId: string, @Body() dto: AddCartItemDto) {
    return { cart: this.cartsService.addItem(cartId, dto.productId, dto.quantity) };
  }

  @Patch('cart/:cartId/items/:productId')
  updateItem(
    @Param('cartId') cartId: string,
    @Param('productId') productId: string,
    @Body() dto: UpdateCartItemDto,
  ) {
    return { cart: this.cartsService.updateItem(cartId, productId, dto.quantity) };
  }

  @Delete('cart/:cartId/items/:productId')
  removeItem(@Param('cartId') cartId: string, @Param('productId') productId: string) {
    return { cart: this.cartsService.removeItem(cartId, productId) };
  }

  @Post('cart/:cartId/checkout')
  checkout(@Param('cartId') cartId: string) {
    return this.cartsService.checkout(cartId);
  }
}
