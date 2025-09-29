import { 
    Controller, 
    Get, 
    Post, 
    Patch, 
    Delete, 
    Body, 
    Param, 
    Query,
    UseGuards,
    Request
} from '@nestjs/common';
import { CartService } from './cart.service';
import { LogService } from '../logger/log.service';
import { 
    AddToCartDto, 
    UpdateCartItemDto, 
    CartResponseDto, 
    CheckoutCartDto 
} from './dto';
import { JwtCustomerGuard } from '../auth/customer-auth/guards/jwt.customer.guard';

interface RequestWithCustomer {
    customer: {
        id: string;
        email: string;
    };
}

@Controller('cart')
@UseGuards(JwtCustomerGuard)
export class CartController {
    constructor(
        private readonly cartService: CartService,
        private readonly logger: LogService,
    ) {}

    @Get()
    async getCart(@Request() req: RequestWithCustomer): Promise<CartResponseDto> {
        this.logger.debug(`Cart GET request from customer: ${req.customer.id} (${req.customer.email})`, 'CartController');
        
        const result = await this.cartService.getCart(req.customer.id);
        
        this.logger.debug(`Cart GET response for customer ${req.customer.id}: ${result ? 'cart data' : 'null'}`, 'CartController');
        
        return result;
    }

    // Get lightweight cart for checkout
    @Get('checkout')
    async getCartForCheckout(@Request() req: RequestWithCustomer): Promise<CheckoutCartDto | null> {
        return this.cartService.getCartForCheckout(req.customer.id);
    }

    // Get cart items count (for header badge)
    @Get('count')
    async getCartItemsCount(@Request() req: RequestWithCustomer): Promise<{ count: number }> {
        const count = await this.cartService.getCartItemsCount(req.customer.id);
        return { count };
    }

    // Calculate cart total
    @Get('total')
    async getCartTotal(
        @Request() req: RequestWithCustomer,
        @Query('currency') currency: string = 'USD'
    ) {
        return this.cartService.calculateCartTotal(req.customer.id, currency);
    }

    // Add item to cart
    @Post('items')
    async addToCart(
        @Request() req: RequestWithCustomer,
        @Body() addToCartDto: AddToCartDto
    ) {
        return this.cartService.addToCart(req.customer.id, addToCartDto);
    }

    // Update cart item quantity
    @Patch('items/:itemId')
    async updateCartItem(
        @Request() req: RequestWithCustomer,
        @Param('itemId') itemId: string,
        @Body() updateCartItemDto: UpdateCartItemDto
    ) {
        return this.cartService.updateCartItem(req.customer.id, itemId, updateCartItemDto);
    }

    // Remove item from cart
    @Delete('items/:itemId')
    async removeFromCart(
        @Request() req: RequestWithCustomer,
        @Param('itemId') itemId: string
    ) {
        return this.cartService.removeFromCart(req.customer.id, itemId);
    }

    // Clear entire cart
    @Delete()
    async clearCart(@Request() req: RequestWithCustomer) {
        return this.cartService.clearCart(req.customer.id);
    }
}