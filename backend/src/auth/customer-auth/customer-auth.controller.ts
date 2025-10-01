import {
    Controller,
    Post,
    Body,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiExtraModels } from '@nestjs/swagger';
import { ApiStandardResponse, ApiStandardErrorResponse } from '../../../common/swagger/api-response.decorator';
import { CustomerAuthService } from './customer-auth.service';
import { CreateCustomerDto } from '../../customer/dto';
import { AuthCustomerDto, ResponseAuthCustomerDto } from './dto';

@ApiTags('customer-auth')
@ApiExtraModels(CreateCustomerDto, AuthCustomerDto, ResponseAuthCustomerDto)
@Controller('customers/auth')
export class CustomerAuthController {
    constructor(private readonly customerAuthService: CustomerAuthService) {}

    @Post('signup')
    @ApiOperation({ summary: 'Customer signup', description: 'Register a new customer account and receive an access token' })
    @ApiStandardResponse(ResponseAuthCustomerDto, 'Customer registered successfully', 201)
    @ApiStandardErrorResponse(400, 'Invalid registration data', 'Validation failed for customer registration')
    @ApiStandardErrorResponse(409, 'Email already exists', 'A customer with this email already exists')
    @HttpCode(HttpStatus.CREATED)
    signup(@Body() dto: CreateCustomerDto): Promise<ResponseAuthCustomerDto> {
        return this.customerAuthService.signup(dto);
    }

    @Post('login')
    @ApiOperation({ summary: 'Customer login', description: 'Authenticate a customer and receive an access token' })
    @ApiStandardResponse(ResponseAuthCustomerDto, 'Customer logged in successfully')
    @ApiStandardErrorResponse(400, 'Invalid credentials', 'Email or password is incorrect')
    @ApiStandardErrorResponse(401, 'Unauthorized', 'Authentication failed')
    @HttpCode(HttpStatus.OK)
    login(@Body() dto: AuthCustomerDto): Promise<ResponseAuthCustomerDto> {
        return this.customerAuthService.login(dto);
    }
}
