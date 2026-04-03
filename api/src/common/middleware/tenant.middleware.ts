import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { ITenantContext, IUser } from '../interfaces/context.interface';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  private readonly logger = new Logger(TenantMiddleware.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly configService: ConfigService,
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    try {
      let tenant: ITenantContext | undefined = undefined;

      // First, try to extract tenantId from JWT if available
      const authHeader = req.get('authorization') || '';
      let jwtTenantId: string | undefined;

      if (authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        try {
          const secret = this.configService.get<string>('JWT_SECRET');
          if (secret) {
            const decoded: any = jwt.verify(token, secret, { ignoreExpiration: true });
            jwtTenantId = decoded.tenantId;
            this.logger.debug(`🔐 JWT tenant ID extracted: ${jwtTenantId}`);
          }
        } catch (error) {
          this.logger.debug(`Failed to decode JWT: ${error instanceof Error ? error.message : ''}`);
        }
      }

      // Try to resolve tenant from subdomain
      const host = req.get('host') || '';
      const subdomain = this.extractSubdomain(host);

      if (subdomain && subdomain !== 'localhost') {
        tenant = await this.resolveTenantByDomain(subdomain);

        if (tenant) {
          (req as any).tenant = tenant;
          this.logger.debug(`✅ Tenant resolved from subdomain: ${subdomain}, schema: ${tenant.schema}`);
        }
      }

      // Try header as fallback
      if (!tenant) {
        const tenantId = req.headers['x-tenant-id'] as string;
        this.logger.debug(`Looking for X-Tenant-ID header: ${tenantId}`);
        
        if (tenantId) {
          tenant = await this.resolveTenantById(tenantId);
          if (tenant) {
            (req as any).tenant = tenant;
            this.logger.debug(`✅ Tenant resolved from header: ${tenantId}, schema: ${tenant.schema}`);
          } else {
            this.logger.warn(`❌ Tenant not found for ID: ${tenantId}`);
          }
        }
      }

      // Finally, try JWT tenantId
      if (!tenant && jwtTenantId) {
        this.logger.debug(`🔍 Trying to resolve tenant from JWT: ${jwtTenantId}`);
        tenant = await this.resolveTenantById(jwtTenantId);
        if (tenant) {
          (req as any).tenant = tenant;
          this.logger.debug(`✅ Tenant resolved from JWT: ${jwtTenantId}, schema: ${tenant.schema}`);
        } else {
          this.logger.warn(`❌ Tenant not found for JWT ID: ${jwtTenantId}`);
        }
      }

      if (!tenant) {
        this.logger.debug(`⚠️  No tenant resolved for ${req.method} ${req.path}`);
      }

      next();
    } catch (error) {
      this.logger.error(`Tenant resolution error: ${error instanceof Error ? error.message : String(error)}`);
      next(error);
    }
  }

  private extractSubdomain(host: string): string | null {
    const parts = host.split('.');
    
    if (parts.length > 2) {
      return parts[0];
    }

    return null;
  }

  private async resolveTenantByDomain(
    domain: string,
  ): Promise<ITenantContext | undefined> {
    const queryRunner = this.dataSource.createQueryRunner();

    try {
      const result = await queryRunner.query(
        `SELECT id, name, schema, domain, is_active FROM public.tenants WHERE domain = $1 LIMIT 1`,
        [domain],
      );

      if (result && result.length > 0) {
        return {
          id: result[0].id,
          name: result[0].name,
          schema: result[0].schema,
          domain: result[0].domain,
          isActive: result[0].is_active,
        };
      }

      return undefined;
    } catch (error) {
      this.logger.error(
        `Failed to resolve tenant by domain ${domain}: ${error instanceof Error ? error.message : String(error)}`,
      );
      return undefined;
    } finally {
      await queryRunner.release();
    }
  }

  private async resolveTenantById(tenantId: string): Promise<ITenantContext | undefined> {
    const queryRunner = this.dataSource.createQueryRunner();

    try {
      const result = await queryRunner.query(
        `SELECT id, name, schema, domain, is_active FROM public.tenants WHERE id = $1 LIMIT 1`,
        [tenantId],
      );

      if (result && result.length > 0) {
        return {
          id: result[0].id,
          name: result[0].name,
          schema: result[0].schema,
          domain: result[0].domain,
          isActive: result[0].is_active,
        };
      }

      return undefined;
    } catch (error) {
      this.logger.error(
        `Failed to resolve tenant by ID ${tenantId}: ${error instanceof Error ? error.message : String(error)}`,
      );
      return undefined;
    } finally {
      await queryRunner.release();
    }
  }
}

// Extend Express Request type with custom properties
declare global {
  namespace Express {
    interface Request {
      tenant?: ITenantContext;
      authUser?: IUser;
    }
  }
}
