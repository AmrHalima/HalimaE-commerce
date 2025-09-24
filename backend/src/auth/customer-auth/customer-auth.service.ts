import { Injectable, UnauthorizedException } from '@nestjs/common';
import { CustomerService } from '../../customer/customer.service';
import {
    CreateCustomerDto,
    AuthCustomerDto,
    UpdateCustomerDto
} from '../../customer/dto';
import * as argon2 from 'argon2';
import { JwtService } from '@nestjs/jwt';
import { Status } from '@prisma/client';


@Injectable()
export class CustomerAuthService {
    constructor(
        private readonly customerService: CustomerService,
        private readonly jwtService: JwtService,
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

    async login(dto: AuthCustomerDto) {
        const customer = await this.customerService.findByEmail(dto.email);
        if (!customer) {
            throw new UnauthorizedException('Invalid credentials');
        }
        
        if (! (await argon2.verify(customer.passwordHash ?? '', dto.password) )) {
            throw new UnauthorizedException('Invalid credentials');
        }

        if (customer.status === Status.INACTIVE) {
            throw new UnauthorizedException('Account is inactive');
        }

        const payload = {
            sub: customer.id,
            email: customer.email,
        }

        const { passwordHash, provider, providerId, ...customerWithoutPassword } = customer;
        return {
            customer: customerWithoutPassword,
            access_token: await this.jwtService.signAsync(payload),
        };
    }
}
