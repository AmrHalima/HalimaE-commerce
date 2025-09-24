import {
    Controller,
    Get,
    UseGuards,
    Request,
    Body,
    Patch,
    Query,
    HttpCode,
    HttpStatus,
    Post,
    Param
} from '@nestjs/common';
import { CustomerService } from './customer.service';
import { JwtCustomerGuard } from '../auth/customer-auth/guards/jwt.customer.guard';
import { JwtUserGuard } from '../auth/user-auth/guards';
import {
    CreateAddressDto,
    UpdateCustomerDto
} from './dto';
import { AddressService } from './address.service';

@Controller('customers')
export class CustomerController {
    constructor(
        private readonly customerService: CustomerService,
        private readonly addressService: AddressService,
    ) {}

    @UseGuards(JwtCustomerGuard)
    @Get('me')
    @HttpCode(HttpStatus.OK)
    async getProfile(@Request() req: any) {
        // The 'user' object is attached to the request by the JwtCustomerGuard
        return this.customerService.findById(req.customer.id);
    }

    @UseGuards(JwtCustomerGuard)
    @Patch('me')
    @HttpCode(HttpStatus.OK)
    async updateProfile(@Request() req: any, @Body() dto: UpdateCustomerDto) {
        return this.customerService.update(req.customer.id, dto);
    }

    @UseGuards(JwtUserGuard)
    @Get()
    @HttpCode(HttpStatus.OK)
    async getAllCustomers(
        @Query('page') page: number,
        @Query('limit') limit: number,
        @Query('search') search: string,
        @Query('sort') sort: string,
        @Query('order') order: 'asc' | 'desc',
    ) {
        return this.customerService.findAll(
            page,
            limit,
            search,
            sort,
            order,
        );
    }

    @UseGuards(JwtCustomerGuard)
    @Post('addresses')
    @HttpCode(HttpStatus.CREATED)
    async createCustomerAddress(@Request() req: any, @Body() dto: CreateAddressDto) {
        return this.addressService.create(req.customer.id, dto);
    }

    @UseGuards(JwtCustomerGuard)
    @Get('addresses/:id')
    @HttpCode(HttpStatus.OK)
    async getCustomerAddress(@Request() req: any, @Param('id') id: string) {
        return this.addressService.findById(req.customer.id, id);
    }


    @UseGuards(JwtCustomerGuard)
    @Get('addresses')
    @HttpCode(HttpStatus.OK)
    async getCustomerAddresses(@Request() req: any) {
        return this.addressService.findAll(req.customer.id);
    }

    @UseGuards(JwtCustomerGuard)
    @Patch('addresses/:id')
    @HttpCode(HttpStatus.OK)
    async updateCustomerAddress(@Request() req: any, @Param('id') id: string, @Body() dto: CreateAddressDto) {
        return this.addressService.update(req.customer.id, id, dto);
    }
}
