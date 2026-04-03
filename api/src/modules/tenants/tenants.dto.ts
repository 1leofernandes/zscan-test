import {
  IsString,
  IsOptional,
  MinLength,
  MaxLength,
  Matches,
  IsUUID,
  IsEmail,
} from 'class-validator';
import { ApiProperty, PartialType } from '@nestjs/swagger';

export class CreateTenantDto {
  @ApiProperty({ example: 'Clínica São Paulo', minLength: 3 })
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  name!: string;

  @ApiProperty({ example: 'clinica-sp', description: 'Unique domain/slug' })
  @IsString()
  @Matches(/^[a-z0-9-]+$/, { message: 'Domain must be lowercase alphanumeric with hyphens' })
  domain!: string;

  @ApiProperty({ required: false, description: 'Schema name (auto-generated if not provided)' })
  @IsOptional()
  @IsString()
  schema?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 'admin@clinica.com' })
  @IsEmail()
  adminEmail!: string;

  @ApiProperty({ example: 'Admin Name' })
  @IsString()
  adminName!: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  @MinLength(8)
  adminPassword!: string;
}

export class UpdateTenantDto extends PartialType(CreateTenantDto) {}

export class TenantResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  domain!: string;

  @ApiProperty()
  schema!: string;

  @ApiProperty()
  isActive!: boolean;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}

export class TenantsListDto {
  @ApiProperty({ type: [TenantResponseDto] })
  items!: TenantResponseDto[];

  @ApiProperty()
  total!: number;
}

export class TenantProvisioningResponseDto {
  @ApiProperty()
  tenantId!: string;

  @ApiProperty()
  tenantName!: string;

  @ApiProperty()
  schema!: string;

  @ApiProperty()
  message!: string;

  @ApiProperty()
  adminUrl!: string;
}
