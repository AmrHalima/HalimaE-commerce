import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LogService } from '../logger/log.service';
import { 
    CreateCartDto, 
    AddToCartDto, 
    UpdateCartItemDto, 
    CartResponseDto, 
    CheckoutCartDto 
} from './dto';

@Injectable()
export class CartService {
    constructor(
        private readonly prismaService: PrismaService,
        private readonly logger: LogService,
    ) { }

    // Create cart for customer (usually called automatically)
    async createCart(createCartDto: CreateCartDto) {
        return this.prismaService.cart.create({
            data: {
                customerId: createCartDto.customerId
            }
        });
    }

    // Get full cart details for display/management
    async getCart(customerId: string): Promise<CartResponseDto> {
        this.logger.debug(`Getting cart for customer: ${customerId}`, 'CartService');
        
        const cart = await this.prismaService.cart.findFirst({
            where: { customerId },
            include: {
                items: {
                    include: {
                        variant: {
                            include: {
                                product: {
                                    select: {
                                        id: true,
                                        name: true,
                                        slug: true,
                                        images: {
                                            take: 1, // Only first image for cart
                                            select: {
                                                url: true,
                                                alt: true
                                            }
                                        }
                                    }
                                },
                                prices: true
                            }
                        }
                    }
                }
            }
        });

        this.logger.debug(`Cart query result for customer ${customerId}: ${cart ? 'found' : 'null'}`, 'CartService');

        if (!cart) {
            this.logger.debug(`No cart found for customer: ${customerId}`, 'CartService');
            throw new NotFoundException('Cart not found');
        }

        // Calculate total items
        const totalItems = cart.items.reduce((sum, item) => sum + item.qty, 0);
        this.logger.debug(`Cart for customer ${customerId} has ${cart.items.length} items, total quantity: ${totalItems}`, 'CartService');

        return {
            ...cart,
            totalItems
        } as CartResponseDto;
    }

    // Lightweight cart for checkout - YOUR SMART APPROACH!
    async getCartForCheckout(customerId: string): Promise<CheckoutCartDto | null> {
        const cart = await this.prismaService.cart.findFirst({
            where: { customerId },
            include: {
                items: {
                    include: {
                        variant: {
                            select: {
                                id: true,
                                sku: true,
                                product: {
                                    select: {
                                        name: true,
                                    }
                                },
                                prices: {
                                    select: {
                                        amount: true,
                                        currency: true,
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });

        if (!cart) return null;

        const totalItems = cart.items.reduce((sum, item) => sum + item.qty, 0);

        return {
            ...cart,
            totalItems
        } as CheckoutCartDto;
    }

    // Get cart items count only (for header badges)
    async getCartItemsCount(customerId: string): Promise<number> {
        const result = await this.prismaService.cartItem.aggregate({
            where: {
                cart: {
                    customerId
                }
            },
            _sum: {
                qty: true
            }
        });
        
        return result._sum.qty || 0;
    }

    // Add item to cart or update quantity if exists
    async addToCart(customerId: string, addToCartDto: AddToCartDto) {
        // Use a transaction to handle race conditions
        return this.prismaService.$transaction(async (prisma) => {
            // Find or create cart
            let cart = await prisma.cart.findFirst({
                where: { customerId }
            });

            if (!cart) {
                cart = await prisma.cart.create({
                    data: { customerId }
                });
            }

            // First try to update existing item
            const updatedItem = await prisma.cartItem.updateMany({
                where: {
                    cartId: cart.id,
                    variantId: addToCartDto.variantId
                },
                data: {
                    qty: {
                        increment: addToCartDto.qty
                    }
                }
            });

            // If no rows were updated, create new item
            if (updatedItem.count === 0) {
                return prisma.cartItem.create({
                    data: {
                        cartId: cart.id,
                        variantId: addToCartDto.variantId,
                        qty: addToCartDto.qty
                    }
                });
            }

            // Return the updated item
            return prisma.cartItem.findFirst({
                where: {
                    cartId: cart.id,
                    variantId: addToCartDto.variantId
                }
            });
        });
    }

    // Update cart item quantity
    async updateCartItem(customerId: string, itemId: string, updateCartItemDto: UpdateCartItemDto) {
        const cartItem = await this.prismaService.cartItem.findFirst({
            where: {
                id: itemId,
                cart: {
                    customerId
                }
            }
        });

        if (!cartItem) {
            throw new NotFoundException('Cart item not found');
        }

        // If quantity is 0, remove item
        if (updateCartItemDto.qty === 0) {
            return this.removeFromCart(customerId, itemId);
        }

        return this.prismaService.cartItem.update({
            where: { id: itemId },
            data: {
                qty: updateCartItemDto.qty
            }
        });
    }

    // Remove item from cart
    async removeFromCart(customerId: string, itemId: string) {
        const cartItem = await this.prismaService.cartItem.findFirst({
            where: {
                id: itemId,
                cart: {
                    customerId
                }
            }
        });

        if (!cartItem) {
            throw new NotFoundException('Cart item not found');
        }

        return this.prismaService.cartItem.delete({
            where: { id: itemId }
        });
    }

    // Clear entire cart
    async clearCart(customerId: string) {
        const cart = await this.prismaService.cart.findFirst({
            where: { customerId }
        });

        if (!cart) {
            throw new NotFoundException('Cart not found');
        }

        await this.prismaService.cartItem.deleteMany({
            where: { cartId: cart.id }
        });

        return { message: 'Cart cleared successfully' };
    }

    // Calculate cart totals (useful for checkout)
    async calculateCartTotal(customerId: string, currency: string = 'EGP') {
        const cart = await this.getCartForCheckout(customerId);
        
        if (!cart || cart.items.length === 0) {
            return { total: 0, currency, itemCount: 0 };
        }

        let total = 0;
        
        cart.items.forEach(item => {
            const price = item.variant.prices.find(p => p.currency === currency);
            if (price) {
                total += Number(price.amount) * item.qty;
            }
        });

        return {
            total: Number(total.toFixed(2)),
            currency,
            itemCount: cart.totalItems
        };
    }
}
