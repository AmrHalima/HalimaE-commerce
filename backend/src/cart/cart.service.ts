import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
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
        private readonly configService: ConfigService,
    ) { }

    async createCart(createCartDto: CreateCartDto) {
        return this.prismaService.cart.create({
            data: {
                customerId: createCartDto.customerId
            }
        });
    }

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

    async addToCart(customerId: string, addToCartDto: AddToCartDto) {
        try {
            return await this.prismaService.$transaction(async (prisma) => {
                const variant = await prisma.productVariant.findUnique({
                    where: { id: addToCartDto.variantId },
                    include: { inventory: true },
                });

                if (!variant) {
                    throw new NotFoundException('Product variant not found');
                }

                if (!variant.isActive) {
                    throw new BadRequestException('Product variant is not available');
                }

                if (variant.inventory) {
                    const currentCartItem = await prisma.cartItem.findFirst({
                        where: {
                            cart: { customerId },
                            variantId: addToCartDto.variantId
                        }
                    });
                    
                    const currentQty = currentCartItem?.qty || 0;
                    const newTotalQty = currentQty + addToCartDto.qty;
                    
                    if (variant.inventory.stockOnHand < newTotalQty) {
                        throw new BadRequestException(
                            `Only ${variant.inventory.stockOnHand} units available`
                        );
                    }
                }

                let cart = await prisma.cart.findFirst({
                    where: { customerId }
                });

                if (!cart) {
                    cart = await prisma.cart.create({
                        data: { customerId }
                    });
                }

                // Get existing item to check current quantity
                const existingItem = await prisma.cartItem.findFirst({
                    where: {
                        cartId: cart.id,
                        variantId: addToCartDto.variantId
                    }
                });

                if (existingItem) {
                    return prisma.cartItem.update({
                        where: { id: existingItem.id },
                        data: {
                            qty: {
                                increment: addToCartDto.qty
                            }
                        }
                    });
                } else {
                    return prisma.cartItem.create({
                        data: {
                            cartId: cart.id,
                            variantId: addToCartDto.variantId,
                            qty: addToCartDto.qty
                        }
                    });
                }
            });
        } catch (error) {
            this.logger.error(
                `Failed to add item to cart for customer ${customerId}`,
                error.stack,
                'CartService'
            );
            throw error;
        }
    }

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
    }

    async calculateCartTotal(customerId: string, currency: string = 'EGP') {
        const cart = await this.getCartForCheckout(customerId);
        const isDevelopment = this.configService.get<string>('NODE_ENV') === 'development';
        
        if (isDevelopment) {
            this.logger.debug(`Calculate cart total - Cart found: ${!!cart}, Items: ${cart?.items.length || 0}, Currency: ${currency}`, 'CartService');
        }
        
        if (!cart || cart.items.length === 0) {
            return { total: 0, currency, itemCount: 0 };
        }

        let total = 0;
        
        cart.items.forEach(item => {
            const price = item.variant.prices.find(p => p.currency === currency);
            
            if (price) {
                const amount = Number(price.amount);
                
                // Validate price is positive
                if (amount < 0) {
                    this.logger.error(`Invalid negative price detected for variant ${item.variant.id}`, '', 'CartService');
                    throw new BadRequestException('Invalid price detected');
                }
                
                // Validate quantity is positive
                if (item.qty < 0) {
                    this.logger.error(`Invalid negative quantity detected for cart item`, '', 'CartService');
                    throw new BadRequestException('Invalid quantity detected');
                }
                
                const itemTotal = amount * item.qty;
                
                // Check for overflow or invalid numbers
                if (!Number.isFinite(itemTotal)) {
                    this.logger.error(`Price calculation overflow for variant ${item.variant.id}`, '', 'CartService');
                    throw new BadRequestException('Price calculation error');
                }
                
                total += itemTotal;
                
                if (isDevelopment) {
                    this.logger.debug(`Price found - Amount: ${amount}, Qty: ${item.qty}, Item Total: ${itemTotal}`, 'CartService');
                }
            } else {
                if (isDevelopment) {
                    this.logger.debug(`No price found for currency: ${currency}`, 'CartService');
                }
            }
        });

        // Final validation
        if (total < 0 || !Number.isFinite(total)) {
            this.logger.error(`Invalid cart total calculated: ${total}`, '', 'CartService');
            throw new BadRequestException('Cart total calculation error');
        }

        return {
            total: Number(total.toFixed(2)),
            currency,
            itemCount: cart.totalItems
        };
    }
}
