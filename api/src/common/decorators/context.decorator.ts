import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { ITenantContext, IUser, IRequestContext } from '../interfaces/context.interface';

export const CurrentTenant = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): ITenantContext => {
    const request = ctx.switchToHttp().getRequest();
    return request.tenant;
  },
);

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): IUser => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);

export const RequestContext = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): IRequestContext => {
    const request = ctx.switchToHttp().getRequest();
    return {
      tenant: request.tenant,
      user: request.user,
    };
  },
);

/**
 * Skip tenant guard for public endpoints
 * Usage: @SkipTenantGuard()
 */
export const SkipTenantGuard = () => {
  return (target: any, key?: string, descriptor?: PropertyDescriptor) => {
    // Marker for the guard to skip tenant validation
  };
};
