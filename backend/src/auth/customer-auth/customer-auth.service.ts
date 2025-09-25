import { Injectable, UnauthorizedException } from '@nestjs/common';
import { CustomerService } from '../../customer/customer.service';
import {
    CreateCustomerDto,
} from '../../customer/dto';
import { AuthCustomerDto, ResponseAuthCustomerDto } from './dto';
import * as argon2 from 'argon2';
import { JwtService } from '@nestjs/jwt';
import { Status } from '@prisma/client';
import { LogService } from '../../logger/log.service';


@Injectable()
export class CustomerAuthService {
    constructor(
        private readonly customerService: CustomerService,
        private readonly jwtService: JwtService,
        private readonly logger: LogService,
    ) { }

    async signup(dto: CreateCustomerDto) {
        const customer = await this.customerService.create({
            ...dto,
        });
        return this.login({
            email: customer.email,
            password: dto.password,
            status: dto.status
        });
    }

    async login(dto: AuthCustomerDto): Promise<ResponseAuthCustomerDto> {
        this.logger.debug(`Attempting to log in customer: ${dto.email}`, CustomerAuthService.name);
        const customer = await this.customerService.findByEmail(dto.email);
        if (!customer) {
            this.logger.warn(`Login failed. Customer not found: ${dto.email}`, CustomerAuthService.name);
            throw new UnauthorizedException('Invalid credentials');
        }
        
        if (! (await argon2.verify(customer.passwordHash ?? '', dto.password) )) {
            this.logger.warn(`Login failed. Invalid credentials for customer: ${dto.email}`, CustomerAuthService.name);
            throw new UnauthorizedException('Invalid credentials');
        }

        if (customer.status === Status.INACTIVE) {
            this.logger.warn(`Login failed. Account is inactive for customer: ${dto.email}`, CustomerAuthService.name);
            throw new UnauthorizedException('Account is inactive');
        }

        this.logger.log(`Customer logged in successfully: ${customer.email} (ID: ${customer.id})`, CustomerAuthService.name);

        const payload = {
            sub: customer.id,
            email: customer.email,
        }

        return {
            name: customer.name,
            email: customer.email,
            status: customer.status ?? Status.ACTIVE,
            access_token: await this.jwtService.signAsync(payload),
        };
    }
}
