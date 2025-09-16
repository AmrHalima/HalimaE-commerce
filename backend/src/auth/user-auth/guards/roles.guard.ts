import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private readonly reflector: Reflector) {}
    canActivate(
        context: ExecutionContext,
    ): boolean | Promise<boolean> | Observable<boolean> {
        const roles = this.reflector.getAllAndOverride<string[]>('roles',
            [context.getHandler(), context.getClass()]);
        if (!roles) return true;

        const { user } = context.switchToHttp().getRequest();

        return roles.some((role) => user.role?.name === role);
    }
}
