import { 
    Controller, 
    Get, 
    Post, 
    Patch,
    Body, 
    Param, 
    Query,
    UseGuards,
    Request,
    HttpCode,
    HttpStatus
} from '@nestjs/common';
import { 
    ApiTags, 
    ApiOperation, 
    ApiBearerAuth,
    ApiParam,
    ApiExtraModels
} from '@nestjs/swagger';
import { ApiStandardResponse, ApiStandardErrorResponse } from '../../common/swagger/api-response.decorator';
import { OrderService } from './order.service';
import { JwtCustomerGuard } from '../auth/customer-auth/guards/jwt.customer.guard';
import { JwtUserGuard, RolesGuard } from '../auth/user-auth/guards';
import { Roles } from '../auth/user-auth/decorators';
import { 
    CreateOrderDto, 
    FilterOrderDto,
    UpdateOrderStatusDto,
    UpdatePaymentStatusDto,
    UpdateFulfillmentStatusDto,
    ResponseOrderDto,
    ResponseOrdersFilteredDto
} from './dto';
import type { RequestWithCustomer } from '../../common/types/request-with-customer.type';

@ApiTags('orders')
@ApiExtraModels(
    CreateOrderDto,
    FilterOrderDto,
    UpdateOrderStatusDto,
    UpdatePaymentStatusDto,
    UpdateFulfillmentStatusDto,
    ResponseOrderDto,
    ResponseOrdersFilteredDto
)
@Controller('orders')
export class OrderController {
    constructor(private readonly orderService: OrderService) {}

    @Post('checkout')
    @UseGuards(JwtCustomerGuard)
    @ApiBearerAuth()
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ 
        summary: 'Create order from cart',
        description: 'Convert customer cart to order. Validates inventory, creates order with snapshots, and clears cart.'
    })
    @ApiStandardResponse(ResponseOrderDto, 'Order created successfully', 201)
    @ApiStandardErrorResponse(400, 'Bad Request', 'Cart is empty or insufficient inventory')
    @ApiStandardErrorResponse(401, 'Unauthorized', 'Authentication required')
    @ApiStandardErrorResponse(404, 'Not Found', 'Address not found')
    async createOrder(
        @Request() req: RequestWithCustomer,
        @Body() createOrderDto: CreateOrderDto
    ) {
        return this.orderService.createOrder(req.customer.sub, createOrderDto);
    }

    @Get('my-orders')
    @UseGuards(JwtCustomerGuard)
    @ApiBearerAuth()
    @ApiOperation({ 
        summary: 'Get customer orders',
        description: 'Get all orders for the authenticated customer with pagination and filtering.'
    })
    @ApiStandardResponse(ResponseOrdersFilteredDto, 'Orders retrieved successfully')
    @ApiStandardErrorResponse(401, 'Unauthorized', 'Authentication required')
    async getMyOrders(
        @Request() req: RequestWithCustomer,
        @Query() filterDto: FilterOrderDto
    ) {
        return this.orderService.getCustomerOrders(req.customer.sub, filterDto);
    }

    @Get('my-orders/:id')
    @UseGuards(JwtCustomerGuard)
    @ApiBearerAuth()
    @ApiOperation({ 
        summary: 'Get customer order by ID',
        description: 'Get detailed information about a specific order for the authenticated customer.'
    })
    @ApiParam({ name: 'id', description: 'Order ID', example: '123e4567-e89b-12d3-a456-426614174000' })
    @ApiStandardResponse(ResponseOrderDto, 'Order retrieved successfully')
    @ApiStandardErrorResponse(401, 'Unauthorized', 'Authentication required')
    @ApiStandardErrorResponse(404, 'Not Found', 'Order not found')
    async getMyOrder(
        @Request() req: RequestWithCustomer,
        @Param('id') orderId: string
    ) {
        return this.orderService.getOrderById(orderId, req.customer.sub);
    }

    @Get('my-orders/number/:orderNo')
    @UseGuards(JwtCustomerGuard)
    @ApiBearerAuth()
    @ApiOperation({ 
        summary: 'Get customer order by order number',
        description: 'Get detailed information about a specific order using order number.'
    })
    @ApiParam({ name: 'orderNo', description: 'Order number', example: 'ORD-2025-000001' })
    @ApiStandardResponse(ResponseOrderDto, 'Order retrieved successfully')
    @ApiStandardErrorResponse(401, 'Unauthorized', 'Authentication required')
    @ApiStandardErrorResponse(404, 'Not Found', 'Order not found')
    async getMyOrderByNumber(
        @Request() req: RequestWithCustomer,
        @Param('orderNo') orderNo: string
    ) {
        return this.orderService.getOrderByOrderNo(orderNo, req.customer.sub);
    }

    @Patch('my-orders/:id/cancel')
    @UseGuards(JwtCustomerGuard)
    @ApiBearerAuth()
    @ApiOperation({ 
        summary: 'Cancel order',
        description: 'Cancel order if status is PENDING or PROCESSING. Restores inventory.'
    })
    @ApiParam({ name: 'id', description: 'Order ID', example: '123e4567-e89b-12d3-a456-426614174000' })
    @ApiStandardResponse(ResponseOrderDto, 'Order cancelled successfully')
    @ApiStandardErrorResponse(400, 'Bad Request', 'Order cannot be cancelled at this stage')
    @ApiStandardErrorResponse(401, 'Unauthorized', 'Authentication required')
    @ApiStandardErrorResponse(404, 'Not Found', 'Order not found')
    async cancelOrder(
        @Request() req: RequestWithCustomer,
        @Param('id') orderId: string
    ) {
        return this.orderService.cancelOrder(orderId, req.customer.sub);
    }

    // Admin Routes

    @Get('admin/all')
    @Roles('admin', 'employee')
    @UseGuards(JwtUserGuard, RolesGuard)
    @ApiBearerAuth()
    @ApiOperation({ 
        summary: 'Get all orders (Admin)',
        description: 'Get all orders across all customers with pagination and filtering. Admin/Employee only.'
    })
    @ApiStandardResponse(ResponseOrdersFilteredDto, 'Orders retrieved successfully')
    @ApiStandardErrorResponse(401, 'Unauthorized', 'Authentication required')
    @ApiStandardErrorResponse(403, 'Forbidden', 'Insufficient permissions')
    async getAllOrders(@Query() filterDto: FilterOrderDto) {
        return this.orderService.getAllOrders(filterDto);
    }

    @Get('admin/:id')
    @Roles('admin', 'employee')
    @UseGuards(JwtUserGuard, RolesGuard)
    @ApiBearerAuth()
    @ApiOperation({ 
        summary: 'Get order by ID (Admin)',
        description: 'Get detailed information about any order. Admin/Employee only.'
    })
    @ApiParam({ name: 'id', description: 'Order ID', example: '123e4567-e89b-12d3-a456-426614174000' })
    @ApiStandardResponse(ResponseOrderDto, 'Order retrieved successfully')
    @ApiStandardErrorResponse(401, 'Unauthorized', 'Authentication required')
    @ApiStandardErrorResponse(403, 'Forbidden', 'Insufficient permissions')
    @ApiStandardErrorResponse(404, 'Not Found', 'Order not found')
    async getOrderById(@Param('id') orderId: string) {
        return this.orderService.getOrderById(orderId);
    }

    @Get('admin/number/:orderNo')
    @Roles('admin', 'employee')
    @UseGuards(JwtUserGuard, RolesGuard)
    @ApiBearerAuth()
    @ApiOperation({ 
        summary: 'Get order by order number (Admin)',
        description: 'Get detailed information about any order using order number. Admin/Employee only.'
    })
    @ApiParam({ name: 'orderNo', description: 'Order number', example: 'ORD-2025-000001' })
    @ApiStandardResponse(ResponseOrderDto, 'Order retrieved successfully')
    @ApiStandardErrorResponse(401, 'Unauthorized', 'Authentication required')
    @ApiStandardErrorResponse(403, 'Forbidden', 'Insufficient permissions')
    @ApiStandardErrorResponse(404, 'Not Found', 'Order not found')
    async getOrderByOrderNo(@Param('orderNo') orderNo: string) {
        return this.orderService.getOrderByOrderNo(orderNo);
    }

    @Patch('admin/:id/status')
    @Roles('admin', 'employee')
    @UseGuards(JwtUserGuard, RolesGuard)
    @ApiBearerAuth()
    @ApiOperation({ 
        summary: 'Update order status (Admin)',
        description: 'Update the overall order status. Admin/Employee only.'
    })
    @ApiParam({ name: 'id', description: 'Order ID', example: '123e4567-e89b-12d3-a456-426614174000' })
    @ApiStandardResponse(ResponseOrderDto, 'Order status updated successfully')
    @ApiStandardErrorResponse(400, 'Bad Request', 'Invalid status transition')
    @ApiStandardErrorResponse(401, 'Unauthorized', 'Authentication required')
    @ApiStandardErrorResponse(403, 'Forbidden', 'Insufficient permissions')
    @ApiStandardErrorResponse(404, 'Not Found', 'Order not found')
    async updateOrderStatus(
        @Param('id') orderId: string,
        @Body() updateDto: UpdateOrderStatusDto
    ) {
        return this.orderService.updateOrderStatus(orderId, updateDto);
    }

    @Patch('admin/:id/payment-status')
    @Roles('admin', 'employee')
    @UseGuards(JwtUserGuard, RolesGuard)
    @ApiBearerAuth()
    @ApiOperation({ 
        summary: 'Update payment status (Admin)',
        description: 'Update the payment status of an order. Admin/Employee only.'
    })
    @ApiParam({ name: 'id', description: 'Order ID', example: '123e4567-e89b-12d3-a456-426614174000' })
    @ApiStandardResponse(ResponseOrderDto, 'Payment status updated successfully')
    @ApiStandardErrorResponse(401, 'Unauthorized', 'Authentication required')
    @ApiStandardErrorResponse(403, 'Forbidden', 'Insufficient permissions')
    @ApiStandardErrorResponse(404, 'Not Found', 'Order not found')
    async updatePaymentStatus(
        @Param('id') orderId: string,
        @Body() updateDto: UpdatePaymentStatusDto
    ) {
        return this.orderService.updatePaymentStatus(orderId, updateDto);
    }

    @Patch('admin/:id/fulfillment-status')
    @Roles('admin', 'employee')
    @UseGuards(JwtUserGuard, RolesGuard)
    @ApiBearerAuth()
    @ApiOperation({ 
        summary: 'Update fulfillment status (Admin)',
        description: 'Update the fulfillment status of an order. Admin/Employee only.'
    })
    @ApiParam({ name: 'id', description: 'Order ID', example: '123e4567-e89b-12d3-a456-426614174000' })
    @ApiStandardResponse(ResponseOrderDto, 'Fulfillment status updated successfully')
    @ApiStandardErrorResponse(401, 'Unauthorized', 'Authentication required')
    @ApiStandardErrorResponse(403, 'Forbidden', 'Insufficient permissions')
    @ApiStandardErrorResponse(404, 'Not Found', 'Order not found')
    async updateFulfillmentStatus(
        @Param('id') orderId: string,
        @Body() updateDto: UpdateFulfillmentStatusDto
    ) {
        return this.orderService.updateFulfillmentStatus(orderId, updateDto);
    }
}
