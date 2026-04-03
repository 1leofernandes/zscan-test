import { IsUUID, IsString, IsEnum, IsOptional, IsDateString, IsBoolean, IsDate } from 'class-validator';
import { ApiProperty, OmitType, PartialType } from '@nestjs/swagger';

export enum UnavailabilityType {
  VACATION = 'vacation',
  BREAK = 'break',
  TRAINING = 'training',
  MAINTENANCE = 'maintenance',
  OTHER = 'other',
}

export class CreateUnavailabilityDto {
  @ApiProperty({ description: 'Professional/resource ID' })
  @IsUUID()
  professionalId!: string;

  @ApiProperty({ description: 'Professional/resource name' })
  @IsString()
  professionalName!: string;

  @ApiProperty({ enum: UnavailabilityType, description: 'Type of unavailability' })
  @IsEnum(UnavailabilityType)
  type!: UnavailabilityType;

  @ApiProperty({ description: 'Title of the unavailability', required: false })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({ description: 'Description of the unavailability', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Start time (ISO 8601 timestamp)', required: false })
  @IsOptional()
  @IsString()
  startTime?: string;

  @ApiProperty({ description: 'End time (ISO 8601 timestamp)', required: false })
  @IsOptional()
  @IsString()
  endTime?: string;

  @ApiProperty({ description: 'Is all day block', default: true })
  @IsOptional()
  @IsBoolean()
  isAllDay?: boolean;

  @ApiProperty({ description: 'Resource room affected', required: false })
  @IsOptional()
  @IsString()
  resourceRoom?: string;

  @ApiProperty({ description: 'Is recurring', default: false })
  @IsOptional()
  @IsBoolean()
  recurring?: boolean;

  @ApiProperty({ description: 'Recurrence pattern (daily, weekly, monthly)', required: false })
  @IsOptional()
  @IsString()
  recurrencePattern?: string;
}

export class UpdateUnavailabilityDto extends PartialType(CreateUnavailabilityDto) {}

export class UnavailabilityResponseDto {
  id!: string;
  professionalId!: string;
  professionalName!: string;
  type!: UnavailabilityType;
  title?: string;
  description?: string;
  startTime?: string;
  endTime?: string;
  isAllDay!: boolean;
  resourceRoom?: string;
  recurring!: boolean;
  recurrencePattern?: string;
  createdAt!: string;
  updatedAt!: string;
}
