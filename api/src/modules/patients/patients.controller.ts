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
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiTags, ApiQuery, ApiOperation } from '@nestjs/swagger';
import { Request } from 'express';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { PatientsService } from './patients.service';
import { CreatePatientDto, UpdatePatientDto, PatientsListDto } from './patients.dto';

@ApiTags('patients')
@ApiBearerAuth('access-token')
@UseGuards(AuthGuard('jwt'), TenantGuard)
@Controller('patients')
export class PatientsController {
  constructor(private readonly patientsService: PatientsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new patient' })
  async create(@Body() createPatientDto: CreatePatientDto, @Req() req: any) {
    const tenantSchema = req.tenant?.schema;
    const userId = req.user?.id;

    if (!tenantSchema) {
      throw new Error('Tenant context not found');
    }

    return this.patientsService.create(createPatientDto, tenantSchema, userId);
  }

  @Get()
  @ApiOperation({ summary: 'List patients with filters and pagination' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'pageSize', required: false, type: Number, example: 20 })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Search by full name' })
  @ApiQuery({ name: 'cpf', required: false, type: String })
  @ApiQuery({ name: 'cns', required: false, type: String })
  async findAll(
    @Query('page') page: number = 1,
    @Query('pageSize') pageSize: number = 20,
    @Query('search') search?: string,
    @Query('cpf') cpf?: string,
    @Query('cns') cns?: string,
    @Req() req: any = {},
  ): Promise<PatientsListDto> {
    const tenantSchema = req.tenant?.schema;

    if (!tenantSchema) {
      throw new Error('Tenant context not found');
    }

    return this.patientsService.findAll(
      tenantSchema,
      Math.max(1, page || 1),
      Math.max(1, Math.min(100, pageSize || 20)),
      search,
      cpf,
      cns,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get patient by ID' })
  async findOne(@Param('id') id: string, @Req() req: any) {
    const tenantSchema = req.tenant?.schema;

    if (!tenantSchema) {
      throw new Error('Tenant context not found');
    }

    return this.patientsService.findOne(id, tenantSchema);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update patient' })
  async update(
    @Param('id') id: string,
    @Body() updatePatientDto: UpdatePatientDto,
    @Req() req: any,
  ) {
    const tenantSchema = req.tenant?.schema;
    const userId = req.authUser?.id;

    if (!tenantSchema) {
      throw new Error('Tenant context not found');
    }

    return this.patientsService.update(id, tenantSchema, updatePatientDto, userId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Inactivate patient (soft delete)' })
  async remove(@Param('id') id: string, @Req() req: any) {
    const tenantSchema = req.tenant?.schema;
    const userId = req.authUser?.id;

    if (!tenantSchema) {
      throw new Error('Tenant context not found');
    }

    await this.patientsService.remove(id, tenantSchema, userId);
  }
}
