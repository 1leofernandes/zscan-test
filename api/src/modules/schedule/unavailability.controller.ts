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
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { UnavailabilityService } from './unavailability.service';
import { CreateUnavailabilityDto, UpdateUnavailabilityDto } from './unavailability.dto';

@ApiTags('unavailability')
@ApiBearerAuth('access-token')
@UseGuards(AuthGuard('jwt'))
@Controller('unavailability')
export class UnavailabilityController {
  constructor(private readonly unavailabilityService: UnavailabilityService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new unavailability period' })
  async create(@Body() createUnavailabilityDto: CreateUnavailabilityDto, @Req() req: any) {
    const tenantSchema = req.tenant?.schema;
    const userId = req.authUser?.id;

    if (!tenantSchema) {
      throw new Error('Tenant context not found');
    }

    return this.unavailabilityService.create(createUnavailabilityDto, tenantSchema, userId);
  }

  @Get()
  @ApiOperation({ summary: 'List unavailability periods' })
  async findAll(
    @Query('professionalId') professionalId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Req() req: any = {},
  ) {
    const tenantSchema = req.tenant?.schema;

    if (!tenantSchema) {
      throw new Error('Tenant context not found');
    }

    return this.unavailabilityService.findAll(
      tenantSchema,
      professionalId,
      startDate,
      endDate,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get unavailability period by ID' })
  async findOne(@Param('id') id: string, @Req() req: any) {
    const tenantSchema = req.tenant?.schema;

    if (!tenantSchema) {
      throw new Error('Tenant context not found');
    }

    return this.unavailabilityService.findOne(id, tenantSchema);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update unavailability period' })
  async update(
    @Param('id') id: string,
    @Body() updateUnavailabilityDto: UpdateUnavailabilityDto,
    @Req() req: any,
  ) {
    const tenantSchema = req.tenant?.schema;
    const userId = req.authUser?.id;

    if (!tenantSchema) {
      throw new Error('Tenant context not found');
    }

    return this.unavailabilityService.update(
      id,
      tenantSchema,
      updateUnavailabilityDto,
      userId,
    );
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete unavailability' })
  async remove(@Param('id') id: string, @Req() req: any) {
    const tenantSchema = req.tenant?.schema;
    return this.unavailabilityService.remove(id, tenantSchema);
  }
}
