import {
    Controller,
    Post,
    Body,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import { CustomerAuthService } from './customer-auth.service';
import { CreateCustomerDto, AuthCustomerDto } from '../../customer/dto';

@Controller('customers/auth')
export class CustomerAuthController {
    constructor(private readonly customerAuthService: CustomerAuthService) {}

    @Post('signup')
    @HttpCode(HttpStatus.CREATED)
    signup(@Body() dto: CreateCustomerDto) {
        return this.customerAuthService.signup(dto);
    }

    @Post('login')
    @HttpCode(HttpStatus.OK)
    login(@Body() dto: AuthCustomerDto) {
        return this.customerAuthService.login(dto);
    }
}
