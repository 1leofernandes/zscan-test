import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  Query,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
  ForbiddenException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { TenantsService } from './tenants.service';
import { CreateTenantDto, UpdateTenantDto } from './tenants.dto';
import { UserRole } from '../../common/interfaces/context.interface';

@ApiTags('tenants')
@ApiBearerAuth('access-token')
@UseGuards(AuthGuard('jwt'))
@Controller('tenants')
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Post()
  @ApiOperation({ summary: 'Create and provision a new tenant (super-admin only)' })
  async create(@Body() createTenantDto: CreateTenantDto, @Req() req: any) {
    // Only super-admin can create tenants
    if (req.authUser?.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Only super-admin can create tenants');
    }

    return this.tenantsService.create(createTenantDto, req.authUser.id);
  }

  @Get()
  @ApiOperation({ summary: 'List all tenants (super-admin only)' })
  async findAll(
    @Query('page') page: number = 1,
    @Query('pageSize') pageSize: number = 20,
    @Req() req: any = {},
  ) {
    // Only super-admin can list all tenants
    if (req.authUser?.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Only super-admin can list tenants');
    }

    return this.tenantsService.findAll(page, pageSize);
  }

  @Get('stats/:id')
  @ApiOperation({ summary: 'Get tenant statistics' })
  async getStats(@Param('id') id: string, @Req() req: any) {
    // Only super-admin or tenant admin can view stats
    if (req.authUser?.role !== UserRole.SUPER_ADMIN && req.authUser?.tenantId !== id) {
      throw new ForbiddenException('Access denied');
    }

    return this.tenantsService.getStats(id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get tenant details' })
  async findOne(@Param('id') id: string, @Req() req: any) {
    // Only super-admin or tenant admin can view details
    if (req.authUser?.role !== UserRole.SUPER_ADMIN && req.authUser?.tenantId !== id) {
      throw new ForbiddenException('Access denied');
    }

    return this.tenantsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update tenant settings' })
  async update(
    @Param('id') id: string,
    @Body() updateTenantDto: UpdateTenantDto,
    @Req() req: any,
  ) {
    // Only super-admin or tenant admin can update
    if (req.authUser?.role !== UserRole.SUPER_ADMIN && req.authUser?.tenantId !== id) {
      throw new ForbiddenException('Access denied');
    }

    return this.tenantsService.update(id, updateTenantDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Deactivate tenant (super-admin only)' })
  async remove(@Param('id') id: string, @Req() req: any) {
    // Only super-admin can deactivate tenants
    if (req.authUser?.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Only super-admin can deactivate tenants');
    }

    await this.tenantsService.deactivate(id);
  }
}
