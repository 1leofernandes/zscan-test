import {
  Injectable,
  CanActivate,
  ExecutionContext,
  BadRequestException,
  ForbiddenException,
  Logger,
  Inject,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { DataSource } from 'typeorm';
import { ITenantContext, UserRole } from '../interfaces/context.interface';

const SKIP_TENANT_GUARD_KEY = 'skipTenantGuard';

@Injectable()
export class TenantGuard implements CanActivate {
  private readonly logger = new Logger(TenantGuard.name);

  constructor(
    private readonly reflector: Reflector,
    @Inject(DataSource) private readonly dataSource: DataSource,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const skipGuard = this.reflector.get<boolean>(
      SKIP_TENANT_GUARD_KEY,
      context.getHandler(),
    );

    if (skipGuard) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Super admin can access any tenant
    if (user.role === UserRole.SUPER_ADMIN) {
      // Try to resolve tenant from subdomain or query param
      request.tenant = await this.resolveTenant(request);
      return true;
    }

    // Regular users must have a tenantId
    if (!user.tenantId) {
      throw new ForbiddenException('Tenant ID not found in token');
    }

    // Resolve and validate tenant
    try {
      const tenant = await this.resolveTenantById(user.tenantId);
      
      if (!tenant.isActive) {
        throw new ForbiddenException('Tenant is inactive');
      }

      request.tenant = tenant;
      return true;
    } catch (error) {
      this.logger.error(`Failed to resolve tenant: ${error instanceof Error ? error.message : String(error)}`);
      throw new ForbiddenException('Invalid tenant');
    }
  }

  private async resolveTenant(request: any): Promise<ITenantContext> {
    const tenantId = request.query.tenantId || request.headers['x-tenant-id'];

    if (!tenantId) {
      throw new BadRequestException('Tenant ID required (query param or header)');
    }

    return this.resolveTenantById(tenantId);
  }

  private async resolveTenantById(tenantId: string): Promise<ITenantContext> {
    // Query the main database to get tenant info
    const queryRunner = this.dataSource.createQueryRunner();

    try {
      const tenant = await queryRunner.query(
        `SELECT id, name, schema, domain, is_active FROM public.tenants WHERE id = $1`,
        [tenantId],
      );

      if (!tenant || tenant.length === 0) {
        throw new BadRequestException('Tenant not found');
      }

      return {
        id: tenant[0].id,
        name: tenant[0].name,
        schema: tenant[0].schema,
        domain: tenant[0].domain,
        isActive: tenant[0].is_active,
      };
    } finally {
      await queryRunner.release();
    }
  }
}
