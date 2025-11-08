import { Injectable, UnauthorizedException } from "@nestjs/common";
import { Strategy, ExtractJwt } from "passport-jwt";
import { PassportStrategy } from "@nestjs/passport";
import { ConfigService } from "@nestjs/config";
import { CustomerService } from "../../../customer/customer.service";


@Injectable()
export class JwtCustomerStrategy extends PassportStrategy(Strategy, 'jwt-customer') {
    constructor(
        private readonly configService: ConfigService,
        private readonly customerService: CustomerService,
    ) {
        const jwtSecret = configService.get<string>('JWT_CUSTOMER_SECRET');
        if (!jwtSecret) {
            throw new Error('JWT_CUSTOMER_SECRET is not defined in the environment variables');
        }
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: jwtSecret,
        });
    }

    async validate(payload: any) {
        const customer = await this.customerService.findById(payload.sub);
        if (!customer) {
            throw new UnauthorizedException('Customer not found');
        }
        return {id: customer.id, email: customer.email};
    }
}
