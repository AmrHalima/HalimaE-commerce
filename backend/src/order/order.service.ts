import { 
    Injectable, 
    NotFoundException, 
    BadRequestException 
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LogService } from '../logger/log.service';
import { CartService } from '../cart/cart.service';
import { ORDERSTATUS, PAYMENTSTATUS, FULFILLMENTSTATUS, Prisma } from '@prisma/client';
import { 
    CreateOrderDto, 
    FilterOrderDto,
    UpdateOrderStatusDto,
    UpdatePaymentStatusDto,
    UpdateFulfillmentStatusDto,
    ResponseOrderDto,
    ResponseOrdersFilteredDto 
} from './dto';

@Injectable()
export class OrderService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly logger: LogService,
        private readonly cartService: CartService,
    ) { }

    /**
     * Generate unique order number
     * Format: ORD-YYYY-XXXXXX (e.g., ORD-2025-000001)
     */
    private async generateOrderNumber(): Promise<string> {
        const year = new Date().getFullYear();
        const prefix = `ORD-${year}-`;
        
        // Get the latest order for this year
        const latestOrder = await this.prisma.order.findFirst({
            where: {
                orderNo: {
                    startsWith: prefix
                }
            },
            orderBy: {
                orderNo: 'desc'
            }
        });

        let nextNumber = 1;
        if (latestOrder) {
            const lastNumber = parseInt(latestOrder.orderNo.split('-')[2]);
            nextNumber = lastNumber + 1;
        }

        return `${prefix}${nextNumber.toString().padStart(6, '0')}`;
    }

    /**
     * Create order from customer's cart
     * Converts cart items to order items with snapshots for historical data
     */
    async createOrder(customerId: string, createOrderDto: CreateOrderDto): Promise<ResponseOrderDto> {
        this.logger.debug(`Creating order for customer: ${customerId}`, 'OrderService');

        try {
            return await this.prisma.$transaction(async (prisma) => {
                // 1. Verify addresses belong to customer
                const [billingAddress, shippingAddress] = await Promise.all([
                    prisma.address.findUnique({
                        where: { 
                            id: createOrderDto.billingAddressId,
                            customerId 
                        }
                    }),
                    prisma.address.findUnique({
                        where: { 
                            id: createOrderDto.shippingAddressId,
                            customerId 
                        }
                    })
                ]);

                if (!billingAddress || !shippingAddress) {
                    throw new BadRequestException('Invalid address');
                }

                // 2. Get cart for checkout (lightweight)
                const cart = await this.cartService.getCartForCheckout(customerId);

                if (!cart || cart.items.length === 0) {
                    throw new BadRequestException('Cart is empty');
                }

                const currency = createOrderDto.currency || 'EGP';

                // 3. Fetch full variant details and validate
                let   subtotal   = 0;
                const orderItems = [];

                for (const item of cart.items) {
                    // Fetch full variant with product and inventory
                    const variant = await prisma.productVariant.findUnique({
                        where: { id: item.variant.id },
                        select: {
                            id: true,
                            isActive: true,
                            sku: true,
                            product: {
                                select: {
                                    name: true
                                }
                            },
                            inventory: { select: { stockOnHand: true } }
                        }
                    });

                    if (!variant) {
                        throw new BadRequestException(
                            `Product variant not found`
                        );
                    }

                    // Check if variant is active
                    if (!variant.isActive) {
                        throw new BadRequestException(
                            `Product "${variant.product.name}" is no longer available`
                        );
                    }

                    // Check inventory
                    if (variant.inventory && variant.inventory.stockOnHand < item.qty) {
                        throw new BadRequestException(
                            `Insufficient stock for "${variant.product.name}". Only ${variant.inventory.stockOnHand} available`
                        );
                    }

                    // Get price for currency from cart item (already has prices)
                    const price = item.variant.prices.find(p => p.currency === currency);
                    if (!price) {
                        throw new BadRequestException(
                            `Price not available for "${variant.product.name}" in ${currency}`
                        );
                    }

                    const itemTotal = Number(price.amount) * item.qty;
                    subtotal += itemTotal;

                    orderItems.push({
                        variantId: variant.id,
                        nameSnapshot: variant.product.name,
                        skuSnapshot: variant.sku,
                        unitPrice: price.amount,
                        qty: item.qty
                    });
                }

                // 4. Generate order number
                const orderNo = await this.generateOrderNumber();

                // 5. Create order
                const order = await prisma.order.create({
                    data: {
                        orderNo,
                        customerId,
                        currency,
                        status: ORDERSTATUS.PENDING,
                        paymentStatus: PAYMENTSTATUS.PENDING,
                        fulfillmentStatus: FULFILLMENTSTATUS.PENDING,
                        billingAddressId: createOrderDto.billingAddressId,
                        shippingAddressId: createOrderDto.shippingAddressId,
                        items: {
                            create: orderItems
                        }
                    },
                    include: {
                        items: { select: {
                            id: true,
                            variantId: true,
                            nameSnapshot: true,
                            skuSnapshot: true,
                            unitPrice: true,
                            qty: true,      
                        }},
                        billingAddress: { select: {
                            firstName: true, lastName: true, city: true, country: true,
                            line1: true, line2: true, phone: true, postalCode: true, id: true,
                        }},
                        shippingAddress: { select: {
                            firstName: true, lastName: true, city: true, country: true,
                            line1: true, line2: true, phone: true, postalCode: true, id: true,
                        }}
                    }
                });

                // 6. Update inventory (reserve stock)
                for (const item of orderItems) {
                    const inventory = await prisma.variantInventory.findUnique({
                        where: { variantId: item.variantId },
                        select: { id: true },
                    });

                    if (inventory) {
                        await prisma.variantInventory.update({
                            where: { variantId: item.variantId },
                            data: {
                                stockOnHand: {
                                    decrement: item.qty
                                }
                            }
                        });
                    }
                }

                // 7. Clear cart using cart service
                await this.cartService.clearCart(customerId);

                this.logger.log(
                    `Order ${orderNo} created successfully for customer ${customerId}`,
                    'OrderService'
                );

                // Calculate totals
                const total = subtotal; // TODO: Add shipping, tax, etc

                return {
                    ...order,
                    subtotal,
                    total
                } as ResponseOrderDto;
            });
        } catch (error) {
            this.logger.error(
                `Failed to create order for customer ${customerId}`,
                error.stack,
                'OrderService'
            );
            throw error;
        }
    }

    /**
     * Get all orders for a customer with pagination and filtering
     */
    async getCustomerOrders(
        customerId: string, 
        filterDto: FilterOrderDto
    ): Promise<ResponseOrdersFilteredDto> {
        const { page = 1, limit = 10, status, paymentStatus, fulfillmentStatus, orderNo } = filterDto;
        const skip = (page - 1) * limit;

        const where: any = { customerId };

        if (status) where.status = status;
        if (paymentStatus) where.paymentStatus = paymentStatus;
        if (fulfillmentStatus) where.fulfillmentStatus = fulfillmentStatus;
        if (orderNo) {
            where.orderNo = {
                contains: orderNo,
                mode: 'insensitive'
            };
        }

        const [orders, total] = await Promise.all([
            this.prisma.order.findMany({
                where,
                select: {
                    id: true,
                    orderNo: true,
                    customerId: true,
                    currency: true,
                    status: true,
                    paymentStatus: true,
                    fulfillmentStatus: true,
                    placedAt: true,
                    updatedAt: true,
                    deletedAt: true,
                    items: {
                        select: {
                            id: true,
                            variantId: true,
                            nameSnapshot: true,
                            skuSnapshot: true,
                            unitPrice: true,
                            qty: true,
                        }
                    },
                    billingAddress: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            phone: true,
                            line1: true,
                            line2: true,
                            city: true,
                            country: true,
                            postalCode: true,
                        }
                    },
                    shippingAddress: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            phone: true,
                            line1: true,
                            line2: true,
                            city: true,
                            country: true,
                            postalCode: true,
                        }
                    }
                },
                orderBy: {
                    placedAt: 'desc'
                },
                skip,
                take: limit
            }),
            this.prisma.order.count({ where })
        ]);

        const ordersWithTotals = orders.map(order => {
            const subtotal = order.items.reduce(
                (sum, item) => sum + Number(item.unitPrice) * item.qty,
                0
            );
            return {
                ...order,
                subtotal,
                total: subtotal
            } as ResponseOrderDto;
        });

        return {
            orders: ordersWithTotals,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        };
    }

    /**
     * Get all orders (admin only) with pagination and filtering
     */
    async getAllOrders(filterDto: FilterOrderDto): Promise<ResponseOrdersFilteredDto> {
        const { page = 1, limit = 10, status, paymentStatus, fulfillmentStatus, orderNo } = filterDto;
        const skip = (page - 1) * limit;

        const where: any = {};

        if (status) where.status = status;
        if (paymentStatus) where.paymentStatus = paymentStatus;
        if (fulfillmentStatus) where.fulfillmentStatus = fulfillmentStatus;
        if (orderNo) {
            where.orderNo = {
                contains: orderNo,
                mode: 'insensitive'
            };
        }

        const [orders, total] = await Promise.all([
            this.prisma.order.findMany({
                where,
                select: {
                    id: true,
                    orderNo: true,
                    customerId: true,
                    customer: {
                        select: {
                            id: true,
                            email: true,
                            name: true,
                        }
                    },
                    currency: true,
                    status: true,
                    paymentStatus: true,
                    fulfillmentStatus: true,
                    placedAt: true,
                    updatedAt: true,
                    deletedAt: true,
                    items: {
                        select: {
                            id: true,
                            variantId: true,
                            nameSnapshot: true,
                            skuSnapshot: true,
                            unitPrice: true,
                            qty: true,
                        }
                    },
                    billingAddress: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            phone: true,
                            line1: true,
                            line2: true,
                            city: true,
                            country: true,
                            postalCode: true,
                        }
                    },
                    shippingAddress: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            phone: true,
                            line1: true,
                            line2: true,
                            city: true,
                            country: true,
                            postalCode: true,
                        }
                    },
                },
                orderBy: {
                    placedAt: 'desc'
                },
                skip,
                take: limit
            }),
            this.prisma.order.count({ where })
        ]);

        const ordersWithTotals = orders.map(order => {
            const subtotal = order.items.reduce(
                (sum, item) => sum + Number(item.unitPrice) * item.qty, 0
            );
            return {
                ...order,
                subtotal,
                total: subtotal
            } as ResponseOrderDto;
        });

        return {
            orders: ordersWithTotals,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        };
    }

    /**
     * Get single order by ID
     */
    async getOrderById(orderId: string, customerId?: string): Promise<ResponseOrderDto> {
        const where: Prisma.OrderWhereUniqueInput = { id: orderId };
        const select: Prisma.OrderSelect          =  {
            id: true,
            orderNo: true,
            customerId: true,
            currency: true,
            status: true,
            paymentStatus: true,
            fulfillmentStatus: true,
            placedAt: true,
            updatedAt: true,
            deletedAt: true,
            items: {
                select: {
                    id: true,
                    variantId: true,
                    nameSnapshot: true,
                    skuSnapshot: true,
                    unitPrice: true,
                    qty: true,
                }
            },
            billingAddress: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    phone: true,
                    line1: true,
                    line2: true,
                    city: true,
                    country: true,
                    postalCode: true,
                }
            },
            shippingAddress: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    phone: true,
                    line1: true,
                    line2: true,
                    city: true,
                    country: true,
                    postalCode: true,
                }
            }
        };
        
        // If customerId provided, ensure order belongs to customer
        if (customerId) {
            where.customerId = customerId;
        } else {
            // For admin, include customer information
            select.customer = {
                select: {
                    id: true,
                    name: true,
                    email: true,
                }
            };
        }

        const order = await this.prisma.order.findUnique({
            where,
            select,
        });

        if (!order) {
            throw new NotFoundException('Order not found');
        }

        const subtotal = order.items.reduce(
            (sum, item) => sum + Number(item.unitPrice) * item.qty,
            0
        );

        return {
            ...order,
            subtotal,
            total: subtotal
        } as ResponseOrderDto;
    }

    /**
     * Get order by order number
     */
    async getOrderByOrderNo(orderNo: string, customerId?: string): Promise<ResponseOrderDto> {
        const where: any = { orderNo };
        
        if (customerId) {
            where.customerId = customerId;
        }

        const order = await this.prisma.order.findUnique({
            where,
            select: {
                id: true,
                orderNo: true,
                customerId: true,
                currency: true,
                status: true,
                paymentStatus: true,
                fulfillmentStatus: true,
                placedAt: true,
                updatedAt: true,
                deletedAt: true,
                items: {
                    select: {
                        id: true,
                        variantId: true,
                        nameSnapshot: true,
                        skuSnapshot: true,
                        unitPrice: true,
                        qty: true,
                    }
                },
                billingAddress: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        phone: true,
                        line1: true,
                        line2: true,
                        city: true,
                        country: true,
                        postalCode: true,
                    }
                },
                shippingAddress: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        phone: true,
                        line1: true,
                        line2: true,
                        city: true,
                        country: true,
                        postalCode: true,
                    }
                }
            }
        });

        if (!order) {
            throw new NotFoundException('Order not found');
        }

        const subtotal = order.items.reduce(
            (sum, item) => sum + Number(item.unitPrice) * item.qty,
            0
        );

        return {
            ...order,
            subtotal,
            total: subtotal
        } as ResponseOrderDto;
    }

    /**
     * Update order status (admin only)
     */
    async updateOrderStatus(
        orderId: string, 
        updateDto: UpdateOrderStatusDto
    ): Promise<ResponseOrderDto> {
        const order = await this.prisma.order.findUnique({
            where: { id: orderId },
            select: { id: true, status: true, orderNo: true }
        });

        if (!order) {
            throw new NotFoundException('Order not found');
        }

        // Validate status transitions
        if (order.status === ORDERSTATUS.DELIVERED && updateDto.status !== ORDERSTATUS.REFUNDED) {
            throw new BadRequestException('Cannot change status of delivered order');
        }

        if (order.status === ORDERSTATUS.CANCELLED) {
            throw new BadRequestException('Cannot change status of cancelled order');
        }

        const updatedOrder = await this.prisma.order.update({
            where: { id: orderId },
            data: { status: updateDto.status },
            select: {
                id: true,
                orderNo: true,
                customerId: true,
                currency: true,
                status: true,
                paymentStatus: true,
                fulfillmentStatus: true,
                placedAt: true,
                updatedAt: true,
                deletedAt: true,
                items: {
                    select: {
                        id: true,
                        variantId: true,
                        nameSnapshot: true,
                        skuSnapshot: true,
                        unitPrice: true,
                        qty: true,
                    }
                },
                billingAddress: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        phone: true,
                        line1: true,
                        line2: true,
                        city: true,
                        country: true,
                        postalCode: true,
                    }
                },
                shippingAddress: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        phone: true,
                        line1: true,
                        line2: true,
                        city: true,
                        country: true,
                        postalCode: true,
                    }
                }
            }
        });

        this.logger.log(
            `Order ${updatedOrder.orderNo} status updated to ${updateDto.status}`,
            'OrderService'
        );

        const subtotal = updatedOrder.items.reduce(
            (sum, item) => sum + Number(item.unitPrice) * item.qty,
            0
        );

        return {
            ...updatedOrder,
            subtotal,
            total: subtotal
        } as ResponseOrderDto;
    }

    /**
     * Update payment status (admin or payment service)
     */
    async updatePaymentStatus(
        orderId: string, 
        updateDto: UpdatePaymentStatusDto
    ): Promise<ResponseOrderDto> {
        const order = await this.prisma.order.findUnique({
            where: { id: orderId },
            select: { id: true, status: true, orderNo: true }
        });

        if (!order) {
            throw new NotFoundException('Order not found');
        }

        const updatedOrder = await this.prisma.order.update({
            where: { id: orderId },
            data: { paymentStatus: updateDto.paymentStatus },
            select: {
                id: true,
                orderNo: true,
                customerId: true,
                currency: true,
                status: true,
                paymentStatus: true,
                fulfillmentStatus: true,
                placedAt: true,
                updatedAt: true,
                deletedAt: true,
                items: {
                    select: {
                        id: true,
                        variantId: true,
                        nameSnapshot: true,
                        skuSnapshot: true,
                        unitPrice: true,
                        qty: true,
                    }
                },
                billingAddress: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        phone: true,
                        line1: true,
                        line2: true,
                        city: true,
                        country: true,
                        postalCode: true,
                    }
                },
                shippingAddress: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        phone: true,
                        line1: true,
                        line2: true,
                        city: true,
                        country: true,
                        postalCode: true,
                    }
                }
            }
        });

        // If payment is successful, move order to PROCESSING
        if (updateDto.paymentStatus === PAYMENTSTATUS.PAID && order.status === ORDERSTATUS.PENDING) {
            await this.prisma.order.update({
                where: { id: orderId },
                data: { status: ORDERSTATUS.PROCESSING }
            });
        }

        this.logger.log(
            `Order ${updatedOrder.orderNo} payment status updated to ${updateDto.paymentStatus}`,
            'OrderService'
        );

        const subtotal = updatedOrder.items.reduce(
            (sum, item) => sum + Number(item.unitPrice) * item.qty,
            0
        );

        return {
            ...updatedOrder,
            subtotal,
            total: subtotal
        } as ResponseOrderDto;
    }

    /**
     * Update fulfillment status (admin or warehouse)
     */
    async updateFulfillmentStatus(
        orderId: string, 
        updateDto: UpdateFulfillmentStatusDto
    ): Promise<ResponseOrderDto> {
        const order = await this.prisma.order.findUnique({
            where: { id: orderId },
            select: { id: true, orderNo: true }
        });

        if (!order) {
            throw new NotFoundException('Order not found');
        }

        const updatedOrder = await this.prisma.order.update({
            where: { id: orderId },
            data: { fulfillmentStatus: updateDto.fulfillmentStatus },
            select: {
                id: true,
                orderNo: true,
                customerId: true,
                currency: true,
                status: true,
                paymentStatus: true,
                fulfillmentStatus: true,
                placedAt: true,
                updatedAt: true,
                deletedAt: true,
                items: {
                    select: {
                        id: true,
                        variantId: true,
                        nameSnapshot: true,
                        skuSnapshot: true,
                        unitPrice: true,
                        qty: true,
                    }
                },
                billingAddress: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        phone: true,
                        line1: true,
                        line2: true,
                        city: true,
                        country: true,
                        postalCode: true,
                    }
                },
                shippingAddress: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        phone: true,
                        line1: true,
                        line2: true,
                        city: true,
                        country: true,
                        postalCode: true,
                    }
                }
            }
        });

        // Update order status based on fulfillment
        if (updateDto.fulfillmentStatus === FULFILLMENTSTATUS.DELIVERED) {
            await this.prisma.order.update({
                where: { id: orderId },
                data: { status: ORDERSTATUS.DELIVERED }
            });
        } else if (updateDto.fulfillmentStatus === FULFILLMENTSTATUS.SHIPPED) {
            await this.prisma.order.update({
                where: { id: orderId },
                data: { status: ORDERSTATUS.SHIPPED }
            });
        }

        this.logger.log(
            `Order ${updatedOrder.orderNo} fulfillment status updated to ${updateDto.fulfillmentStatus}`,
            'OrderService'
        );

        const subtotal = updatedOrder.items.reduce(
            (sum, item) => sum + Number(item.unitPrice) * item.qty,
            0
        );

        return {
            ...updatedOrder,
            subtotal,
            total: subtotal
        } as ResponseOrderDto;
    }

    /**
     * Cancel order (customer can cancel if status is PENDING or PROCESSING)
     */
    async cancelOrder(orderId: string, customerId: string): Promise<ResponseOrderDto> {
        const order = await this.prisma.order.findUnique({
            where: { 
                id: orderId,
                customerId 
            },
            include: {
                items: {
                    include: {
                        variant: {
                            include: {
                                inventory: true
                            }
                        }
                    }
                }
            }
        });

        if (!order) {
            throw new NotFoundException('Order not found');
        }

        const cancellableStatuses: ORDERSTATUS[] = [ORDERSTATUS.PENDING, ORDERSTATUS.PROCESSING];
        if (!cancellableStatuses.includes(order.status)) {
            throw new BadRequestException(
                'Order cannot be cancelled at this stage'
            );
        }

        // Restore inventory
        await this.prisma.$transaction(async (prisma) => {
            for (const item of order.items) {
                if (item.variant.inventory) {
                    await prisma.variantInventory.update({
                        where: { variantId: item.variantId },
                        data: {
                            stockOnHand: {
                                increment: item.qty
                            }
                        }
                    });
                }
            }

            await prisma.order.update({
                where: { id: orderId },
                data: { 
                    status: ORDERSTATUS.CANCELLED,
                    paymentStatus: PAYMENTSTATUS.REFUNDED
                }
            });
        });

        this.logger.log(
            `Order ${order.orderNo} cancelled by customer ${customerId}`,
            'OrderService'
        );

        return this.getOrderById(orderId, customerId);
    }
}
