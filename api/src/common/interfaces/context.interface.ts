/**
 * Tenant context interface
 * Represents the current tenant in a multi-tenant application
 */
export interface ITenantContext {
  id: string;
  name: string;
  schema: string;
  domain?: string;
  isActive: boolean;
}

/**
 * Authenticated user interface
 */
export interface IUser {
  id: string;
  email: string;
  role: UserRole;
  tenantId?: string;
  permissions?: string[];
}

export enum UserRole {
  SUPER_ADMIN = 'super-admin',
  ADMIN = 'admin',
  USER = 'user',
  CLINICIAN = 'clinician',
  RECEPTIONIST = 'receptionist',
}

/**
 * Request context with tenant and user info
 */
export interface IRequestContext {
  tenant: ITenantContext;
  user: IUser;
}

/**
 * JWT Payload
 */
export interface IJwtPayload {
  sub: string;
  email: string;
  tenantId: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}
