import {
  IsString,
  IsUUID,
  IsEnum,
  IsDateString,
  IsOptional,
  IsNumber,
  Min,
  Max,
  ArrayMaxSize,
  IsArray,
} from 'class-validator';
import { ApiProperty, PartialType } from '@nestjs/swagger';

export enum ScheduleStatus {
  SCHEDULED = 'scheduled',
  CONFIRMED = 'confirmed',
  IN_ATTENDANCE = 'in_attendance',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  NO_SHOW = 'no_show',
}

export enum ProcedureType {
  CONSULTATION = 'consultation',
  CHECKUP = 'checkup',
  IMAGING = 'imaging',
  EXAM = 'exam',
  FOLLOW_UP = 'follow_up',
  SURGERY = 'surgery',
}

export enum ScheduleOrigin {
  IN_PERSON = 'in_person',
  PHONE = 'phone',
  ONLINE = 'online',
}

export class CreateScheduleDto {
  @ApiProperty({ description: 'Patient ID (UUID)' })
  @IsUUID()
  patientId!: string;

  @ApiProperty({ description: 'Professional/Doctor ID (UUID)' })
  @IsUUID()
  professionalId!: string;

  @ApiProperty({ example: 'Dr. Silva' })
  @IsString()
  professionalName!: string;

  @ApiProperty({ required: false, example: 'Sala 101' })
  @IsOptional()
  @IsString()
  resourceRoom?: string;

  @ApiProperty({ enum: ProcedureType })
  @IsEnum(ProcedureType)
  procedureType!: ProcedureType;

  @ApiProperty({ example: '2024-01-15T14:00:00Z' })
  @IsDateString()
  startTime!: string;

  @ApiProperty({ example: '2024-01-15T15:00:00Z' })
  @IsDateString()
  endTime!: string;

  @ApiProperty({ enum: ScheduleStatus, default: ScheduleStatus.SCHEDULED })
  @IsOptional()
  @IsEnum(ScheduleStatus)
  status?: ScheduleStatus;

  @ApiProperty({ enum: ScheduleOrigin, default: ScheduleOrigin.IN_PERSON })
  @IsOptional()
  @IsEnum(ScheduleOrigin)
  origin?: ScheduleOrigin;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  patientInstructions?: string;
}

export class UpdateScheduleDto extends PartialType(CreateScheduleDto) {}

export class UpdateScheduleStatusDto {
  @ApiProperty({ enum: ScheduleStatus })
  @IsEnum(ScheduleStatus)
  status!: ScheduleStatus;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class ScheduleFilterDto {
  @ApiProperty({ required: false, example: '2024-01-15' })
  @IsOptional()
  @IsDateString()
  dateStart?: string;

  @ApiProperty({ required: false, example: '2024-01-22' })
  @IsOptional()
  @IsDateString()
  dateEnd?: string;

  @ApiProperty({ required: false, description: 'Filter by professional ID' })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  professionalIds?: string[];

  @ApiProperty({ required: false, enum: ScheduleStatus, isArray: true })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  statuses?: ScheduleStatus[];

  @ApiProperty({ required: false, enum: ProcedureType })
  @IsOptional()
  procedureType?: ProcedureType;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  pageSize?: number;
}

export class ScheduleResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  patientId!: string;

  @ApiProperty()
  patientName!: string;

  @ApiProperty()
  professionalId!: string;

  @ApiProperty()
  professionalName!: string;

  @ApiProperty()
  procedureType!: ProcedureType;

  @ApiProperty()
  startTime!: Date;

  @ApiProperty()
  endTime!: Date;

  @ApiProperty()
  status!: ScheduleStatus;

  @ApiProperty()
  origin!: ScheduleOrigin;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}

export class AvailabilitySlotDto {
  @ApiProperty({ example: '2024-01-15T14:00:00Z' })
  startTime!: string;

  @ApiProperty({ example: '2024-01-15T15:00:00Z' })
  endTime!: string;

  @ApiProperty({ example: true })
  available!: boolean;
}

export class AvailabilityResponseDto {
  @ApiProperty()
  professionalId!: string;

  @ApiProperty()
  date!: string;

  @ApiProperty({ type: [AvailabilitySlotDto] })
  slots!: AvailabilitySlotDto[];
}

export class AgendaDayViewDto {
  @ApiProperty()
  date!: string;

  @ApiProperty()
  dayOfWeek!: string;

  @ApiProperty({ type: [ScheduleResponseDto] })
  schedules!: ScheduleResponseDto[];

  @ApiProperty()
  stats!: {
    total: number;
    booked: number;
    available: number;
  };
}

export class AgendaWeekViewDto {
  @ApiProperty()
  weekStart!: string;

  @ApiProperty()
  weekEnd!: string;

  @ApiProperty({ type: [AgendaDayViewDto] })
  days!: AgendaDayViewDto[];
}
