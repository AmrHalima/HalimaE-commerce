import {
    Controller,
    Post,
    Body,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import { CustomerAuthService } from './customer-auth.service';
import { CreateCustomerDto } from '../../customer/dto';
import { AuthCustomerDto, ResponseAuthCustomerDto } from './dto';

@Controller('customers/auth')
export class CustomerAuthController {
    constructor(private readonly customerAuthService: CustomerAuthService) {}

    @Post('signup')
    @HttpCode(HttpStatus.CREATED)
    signup(@Body() dto: CreateCustomerDto): Promise<ResponseAuthCustomerDto> {
        return this.customerAuthService.signup(dto);
    }

    @Post('login')
    @HttpCode(HttpStatus.OK)
    login(@Body() dto: AuthCustomerDto): Promise<ResponseAuthCustomerDto> {
        return this.customerAuthService.login(dto);
    }
}
