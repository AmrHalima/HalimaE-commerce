import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtUserGuard extends AuthGuard('jwt-user') {
    handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
        if (err) throw err;
        if (!user) throw new UnauthorizedException();
        return user;
    }
}
