import { Module } from '@nestjs/common';
import { ScheduleService } from './schedule.service';
import { ScheduleController } from './schedule.controller';
import { UnavailabilityService } from './unavailability.service';
import { UnavailabilityController } from './unavailability.controller';

@Module({
  controllers: [ScheduleController, UnavailabilityController],
  providers: [ScheduleService, UnavailabilityService],
  exports: [ScheduleService, UnavailabilityService],
})
export class ScheduleModule {}
