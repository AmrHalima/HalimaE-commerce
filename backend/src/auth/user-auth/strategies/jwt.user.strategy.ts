import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy, ExtractJwt } from "passport-jwt";
import { UsersService } from "../../../users/users.service";

@Injectable()
export class JwtUserStrategy extends PassportStrategy(Strategy, 'jwt-user') {
    constructor(
        private readonly configService: ConfigService,
        private readonly userService: UsersService
    ) {
        const jwtSecret = configService.get<string>('JWT_USER_SECRET');
        if (!jwtSecret) {
            throw new Error('JWT_USER_SECRET is not defined in environment variables');
        }
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            secretOrKey: jwtSecret,
        });
    }

    async validate(payload: { sub: string, email: string, role: string}) {
        return payload;
    }
}