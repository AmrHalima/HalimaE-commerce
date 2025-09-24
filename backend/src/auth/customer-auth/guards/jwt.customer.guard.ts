import { Injectable, ExecutionContext, CanActivate, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtCustomerGuard extends AuthGuard('jwt-customer') implements CanActivate{
  // run after passport sets req.user
  async canActivate(context: ExecutionContext) {
    const can = (await super.canActivate(context)) as boolean;
    const req = context.switchToHttp().getRequest();

    if (req && req.user) {
      // expose as req.customer
      req.customer = req.user;
      // try to remove duplicate req.user
      try {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        delete req.user;
      } catch {
        req.user = undefined;
      }
    }

    return can;
  }

  handleRequest(err: any, customer: any, info: any) {
    if (err) throw err;
    if (!customer) throw new UnauthorizedException();
    return customer;
  }
}
