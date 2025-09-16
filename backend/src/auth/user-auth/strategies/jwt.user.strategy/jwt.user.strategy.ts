import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy, ExtractJwt } from "passport-jwt";
import { UsersService } from "src/users/users.service";

@Injectable()
export class JwtUserStrategy extends PassportStrategy(Strategy, 'jwt-user') {
    constructor(
        private readonly userService: UsersService
    ) {
        const jwtSecret = process.env.JWT_USER_SECRET;
        if (!jwtSecret) {
            throw new Error('JWT_SECRET is not defined in configuration');
        }
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            secretOrKey: jwtSecret,
        });
    }

    async validate(payload: { sub: string, email: string, role: string}) {
        return await this.userService.findById(payload.sub);
    }
}
