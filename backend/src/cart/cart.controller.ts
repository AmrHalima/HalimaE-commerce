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
    Request,
    HttpCode,
    HttpStatus
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiExtraModels } from '@nestjs/swagger';
import { ApiStandardResponse, ApiStandardErrorResponse, ApiStandardNoContentResponse } from '../../common/swagger/api-response.decorator';
import { CartService } from './cart.service';
import { LogService } from '../logger/log.service';
import { 
    AddToCartDto, 
    UpdateCartItemDto, 
    CartResponseDto, 
    CheckoutCartDto,
    AddToCartResponseDto
} from './dto';
import { JwtCustomerGuard } from '../auth/customer-auth/guards/jwt.customer.guard';

interface RequestWithCustomer {
    customer: {
        id: string;
        email: string;
    };
}

@ApiTags('cart')
@ApiExtraModels(AddToCartDto, UpdateCartItemDto, CartResponseDto, CheckoutCartDto, AddToCartResponseDto)
@Controller('cart')
@ApiBearerAuth()
@UseGuards(JwtCustomerGuard)
export class CartController {
    constructor(
        private readonly cartService: CartService,
        private readonly logger: LogService,
    ) {}

    @Get()
    @ApiOperation({ summary: 'Get cart', description: 'Retrieve the current customer\'s shopping cart with all items and details' })
    @ApiStandardResponse(CartResponseDto, 'Cart retrieved successfully')
    @ApiStandardErrorResponse(401, 'Unauthorized', 'Authentication required')
    @ApiStandardErrorResponse(404, 'Cart not found', 'No cart exists for this customer')
    async getCart(@Request() req: RequestWithCustomer): Promise<CartResponseDto> {
        this.logger.debug(`Cart GET request from customer: ${req.customer.id} (${req.customer.email})`, 'CartController');
        
        const result = await this.cartService.getCart(req.customer.id);
        
        this.logger.debug(`Cart GET response for customer ${req.customer.id}: ${result ? 'cart data' : 'null'}`, 'CartController');
        
        return result;
    }

    @Get('checkout')
    @ApiOperation({ summary: 'Get cart for checkout', description: 'Retrieve a lightweight version of the cart with only essential data needed for checkout' })
    @ApiStandardResponse(CheckoutCartDto, 'Checkout cart retrieved successfully')
    @ApiStandardErrorResponse(401, 'Unauthorized', 'Authentication required')
    @ApiStandardErrorResponse(404, 'Cart not found', 'No cart exists for this customer')
    async getCartForCheckout(@Request() req: RequestWithCustomer): Promise<CheckoutCartDto | null> {
        return this.cartService.getCartForCheckout(req.customer.id);
    }

    @Get('count')
    @ApiOperation({ summary: 'Get cart items count', description: 'Get the total number of items in the cart (useful for header badge)' })
    @ApiStandardResponse(Object, 'Cart count retrieved successfully')
    @ApiStandardErrorResponse(401, 'Unauthorized', 'Authentication required')
    async getCartItemsCount(@Request() req: RequestWithCustomer): Promise<{ count: number }> {
        const count = await this.cartService.getCartItemsCount(req.customer.id);
        return { count };
    }

    // Calculate cart total
    @Get('total')
    @ApiOperation({ summary: 'Get cart total', description: 'Calculate the total price of all items in the cart for a specific currency' })
    @ApiStandardResponse(Object, 'Cart total calculated successfully')
    @ApiStandardErrorResponse(401, 'Unauthorized', 'Authentication required')
    @ApiStandardErrorResponse(404, 'Cart not found', 'No cart exists for this customer')
    async getCartTotal(
        @Request() req: RequestWithCustomer,
        @Query('currency') currency: string = 'EGP'
    ) {
        return this.cartService.calculateCartTotal(req.customer.id, currency);
    }

    @Post('items')
    @ApiOperation({ summary: 'Add item to cart', description: 'Add a product variant to the shopping cart with specified quantity' })
    @ApiStandardResponse(AddToCartResponseDto, 'Item added to cart successfully', 201)
    @ApiStandardErrorResponse(400, 'Invalid request', 'Invalid variant ID or quantity')
    @ApiStandardErrorResponse(401, 'Unauthorized', 'Authentication required')
    @ApiStandardErrorResponse(404, 'Variant not found', 'Product variant does not exist')
    @HttpCode(HttpStatus.CREATED)
    async addToCart(
        @Request() req: RequestWithCustomer,
        @Body() addToCartDto: AddToCartDto
    ) {
        return this.cartService.addToCart(req.customer.id, addToCartDto);
    }

    @Patch('items/:itemId')
    @ApiOperation({ summary: 'Update cart item', description: 'Update the quantity of a cart item (set to 0 to remove)' })
    @ApiStandardResponse(AddToCartResponseDto, 'Cart item updated successfully')
    @ApiStandardErrorResponse(400, 'Invalid quantity', 'Quantity must be a positive integer or 0 to remove')
    @ApiStandardErrorResponse(401, 'Unauthorized', 'Authentication required')
    @ApiStandardErrorResponse(404, 'Cart item not found', 'Cart item with the given ID was not found')
    async updateCartItem(
        @Request() req: RequestWithCustomer,
        @Param('itemId') itemId: string,
        @Body() updateCartItemDto: UpdateCartItemDto
    ) {
        return this.cartService.updateCartItem(req.customer.id, itemId, updateCartItemDto);
    }

    @Delete('items/:itemId')
    @ApiOperation({ summary: 'Remove item from cart', description: 'Remove a specific item from the shopping cart' })
    @ApiStandardNoContentResponse('Cart item removed successfully')
    @ApiStandardErrorResponse(401, 'Unauthorized', 'Authentication required')
    @ApiStandardErrorResponse(404, 'Cart item not found', 'Cart item with the given ID was not found')
    @HttpCode(HttpStatus.NO_CONTENT)
    async removeFromCart(
        @Request() req: RequestWithCustomer,
        @Param('itemId') itemId: string
    ) {
        return this.cartService.removeFromCart(req.customer.id, itemId);
    }

    @Delete()
    @ApiOperation({ summary: 'Clear cart', description: 'Remove all items from the shopping cart' })
    @ApiStandardNoContentResponse('Cart cleared successfully')
    @ApiStandardErrorResponse(401, 'Unauthorized', 'Authentication required')
    @ApiStandardErrorResponse(404, 'Cart not found', 'No cart exists for this customer')
    @HttpCode(HttpStatus.NO_CONTENT)
    async clearCart(@Request() req: RequestWithCustomer) {
        return this.cartService.clearCart(req.customer.id);
    }
}