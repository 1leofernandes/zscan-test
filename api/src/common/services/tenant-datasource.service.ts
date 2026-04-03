import { Injectable, Scope, Inject } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { DataSource } from 'typeorm';
import { ITenantContext } from '../interfaces/context.interface';

@Injectable({ scope: Scope.REQUEST })
export class TenantDataSource {
  private tenantSchema: string | null = null;

  constructor(
    @Inject(DataSource) private readonly dataSource: DataSource,
    @Inject(REQUEST) private readonly request: any,
  ) {
    this.initializeTenantSchema();
  }

  private initializeTenantSchema(): void {
    const tenant: ITenantContext | undefined = this.request.tenant;
    if (tenant) {
      this.tenantSchema = tenant.schema;
    }
  }

  /**
   * Get the query builder for the current tenant's schema
   */
  getRepository(entity: any) {
    const repository = this.dataSource.getRepository(entity);
    
    if (this.tenantSchema) {
      // Set schema for this query
      return repository.createQueryBuilder().setQueryRunner(
        this.dataSource.createQueryRunner(),
      ).from(`${this.tenantSchema}.${repository.metadata.tableName}`, 'entity');
    }

    return repository;
  }

  /**
   * Execute a query in the tenant's schema
   */
  async query(sql: string, parameters?: any[]): Promise<any> {
    const queryRunner = this.dataSource.createQueryRunner();
    
    try {
      if (this.tenantSchema) {
        // Set search_path to tenant schema
        await queryRunner.query(`SET search_path TO ${this.tenantSchema}, public`);
      }

      return await queryRunner.query(sql, parameters);
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Get the current tenant schema
   */
  getTenantSchema(): string | null {
    return this.tenantSchema;
  }

  /**
   * Get the current request's tenant info
   */
  getCurrentTenant(): ITenantContext | undefined {
    return this.request.tenant;
  }

  /**
   * Get the DataSource instance
   */
  getDataSource(): DataSource {
    return this.dataSource;
  }
}
