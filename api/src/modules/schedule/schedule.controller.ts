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
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { Request } from 'express';
import { ScheduleService } from './schedule.service';
import {
  CreateScheduleDto,
  UpdateScheduleDto,
  UpdateScheduleStatusDto,
  ScheduleFilterDto,
} from './schedule.dto';

@ApiTags('schedule')
@ApiBearerAuth('access-token')
@UseGuards(AuthGuard('jwt'))
@Controller('schedule')
export class ScheduleController {
  constructor(private readonly scheduleService: ScheduleService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new appointment' })
  async create(@Body() createScheduleDto: CreateScheduleDto, @Req() req: any) {
    const tenantSchema = req.tenant?.schema;
    const userId = req.authUser?.id;

    if (!tenantSchema) {
      throw new Error('Tenant context not found');
    }

    return this.scheduleService.create(createScheduleDto, tenantSchema, userId);
  }

  @Get('day-view')
  @ApiOperation({ summary: 'Get agenda for a specific day' })
  async getDayView(
    @Query('date') date: string,
    @Query('professionalIds') professionalIds?: string,
    @Query('statuses') statuses?: string,
    @Req() req: any = {},
  ) {
    const tenantSchema = req.tenant?.schema;

    if (!tenantSchema) {
      throw new Error('Tenant context not found');
    }

    const filters: ScheduleFilterDto = {
      professionalIds: professionalIds ? professionalIds.split(',') : undefined,
      statuses: statuses ? (statuses.split(',') as any) : undefined,
    };

    return this.scheduleService.getAgendaDayView(tenantSchema, date, filters);
  }

  @Get('week-view')
  @ApiOperation({ summary: 'Get agenda for a week' })
  async getWeekView(
    @Query('startDate') startDate: string,
    @Query('professionalIds') professionalIds?: string,
    @Query('statuses') statuses?: string,
    @Req() req: any = {},
  ) {
    const tenantSchema = req.tenant?.schema;

    if (!tenantSchema) {
      throw new Error('Tenant context not found');
    }

    const filters: ScheduleFilterDto = {
      professionalIds: professionalIds ? professionalIds.split(',') : undefined,
      statuses: statuses ? (statuses.split(',') as any) : undefined,
    };

    return this.scheduleService.getAgendaWeekView(tenantSchema, startDate, filters);
  }

  @Get('availability')
  @ApiOperation({ summary: 'Check availability for a professional' })
  async getAvailability(
    @Query('professionalId') professionalId: string,
    @Query('date') date: string,
    @Query('slotDuration') slotDuration?: number,
    @Req() req: any = {},
  ) {
    const tenantSchema = req.tenant?.schema;

    if (!tenantSchema) {
      throw new Error('Tenant context not found');
    }

    return this.scheduleService.getAvailability(
      tenantSchema,
      professionalId,
      date,
      slotDuration || 30,
    );
  }

  @Get()
  @ApiOperation({ summary: 'List schedules with filters' })
  async findAll(@Query() filters: ScheduleFilterDto, @Req() req: any = {}) {
    const tenantSchema = req.tenant?.schema;

    if (!tenantSchema) {
      throw new Error('Tenant context not found');
    }

    return this.scheduleService.findAll(tenantSchema, filters);
  }

  @Get('debug/all')
  @ApiOperation({ summary: 'Get all schedules for debugging' })
  async getAllSchedules(@Req() req: any = {}) {
    const tenantSchema = req.tenant?.schema;

    if (!tenantSchema) {
      throw new Error('Tenant context not found');
    }

    return this.scheduleService.getAllSchedules(tenantSchema);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get appointment by ID' })
  async findOne(@Param('id') id: string, @Req() req: any) {
    const tenantSchema = req.tenant?.schema;

    if (!tenantSchema) {
      throw new Error('Tenant context not found');
    }

    return this.scheduleService.findOne(id, tenantSchema);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update appointment' })
  async update(
    @Param('id') id: string,
    @Body() updateScheduleDto: UpdateScheduleDto,
    @Req() req: any,
  ) {
    const tenantSchema = req.tenant?.schema;
    const userId = req.authUser?.id;

    if (!tenantSchema) {
      throw new Error('Tenant context not found');
    }

    return this.scheduleService.update(id, tenantSchema, updateScheduleDto, userId);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update appointment status' })
  async updateStatus(
    @Param('id') id: string,
    @Body() statusDto: UpdateScheduleStatusDto,
    @Req() req: any,
  ) {
    const tenantSchema = req.tenant?.schema;
    const userId = req.authUser?.id;

    if (!tenantSchema) {
      throw new Error('Tenant context not found');
    }

    return this.scheduleService.updateStatus(id, tenantSchema, statusDto, userId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Cancel appointment' })
  async remove(@Param('id') id: string, @Req() req: any) {
    const tenantSchema = req.tenant?.schema;
    const userId = req.authUser?.id;

    if (!tenantSchema) {
      throw new Error('Tenant context not found');
    }

    const cancelDto: UpdateScheduleStatusDto = {
      status: 'cancelled' as any,
      notes: 'Cancelled by user',
    };

    await this.scheduleService.updateStatus(id, tenantSchema, cancelDto, userId);
  }

  @Post('validate/conflicts')
  @ApiOperation({ summary: 'Validate schedule conflicts and unavailabilities' })
  async validateSchedule(
    @Body() validateDto: { professionalId: string; startTime: string; endTime: string; scheduleId?: string },
    @Req() req: any,
  ) {
    const tenantSchema = req.tenant?.schema;

    if (!tenantSchema) {
      throw new Error('Tenant context not found');
    }

    return this.scheduleService.validateSchedule(
      tenantSchema,
      validateDto.professionalId,
      validateDto.startTime,
      validateDto.endTime,
      validateDto.scheduleId,
    );
  }

  @Patch(':id/reschedule')
  @ApiOperation({ summary: 'Reschedule an appointment' })
  async reschedule(
    @Param('id') id: string,
    @Body() rescheduleDto: { startTime: string; endTime: string },
    @Req() req: any,
  ) {
    const tenantSchema = req.tenant?.schema;
    const userId = req.authUser?.id;

    if (!tenantSchema) {
      throw new Error('Tenant context not found');
    }

    return this.scheduleService.reschedule(
      id,
      tenantSchema,
      rescheduleDto.startTime,
      rescheduleDto.endTime,
      userId,
    );
  }
}
