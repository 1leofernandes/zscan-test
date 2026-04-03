// import { Test, TestingModule } from '@nestjs/testing';
// import { ScheduleService } from './schedule.service';
// import { DataSource } from 'typeorm';
// import { CACHE_MANAGER } from '@nestjs/cache-manager';
// import { ConflictException, NotFoundException } from '@nestjs/common';

// describe('ScheduleService', () => {
//   let service: ScheduleService;
//   let dataSource: DataSource;
//   let cacheManager: any;

//   beforeEach(async () => {
//     const module: TestingModule = await Test.createTestingModule({
//       providers: [
//         ScheduleService,
//         {
//           provide: DataSource,
//           useValue: {
//             query: jest.fn(),
//           },
//         },
//         {
//           provide: CACHE_MANAGER,
//           useValue: {
//             get: jest.fn(),
//             set: jest.fn(),
//             del: jest.fn(),
//           },
//         },
//       ],
//     }).compile();

//     service = module.get<ScheduleService>(ScheduleService);
//     dataSource = module.get<DataSource>(DataSource);
//     cacheManager = module.get(CACHE_MANAGER);
//   });

//   describe('create', () => {
//     it('should create a schedule without conflicts', async () => {
//       const createDto = {
//         patientId: 'patient-123',
//         professionalId: 'pro-123',
//         startTime: new Date('2024-01-15 10:00'),
//         endTime: new Date('2024-01-15 10:30'),
//         procedureType: 'consultation',
//         origin: 'in_person',
//       };

//       jest.spyOn(dataSource, 'query').mockResolvedValueOnce([]); // No conflicts
//       jest.spyOn(dataSource, 'query').mockResolvedValueOnce([{ id: 'sched-123' }]); // Create

//       const result = await service.create(createDto, 'user-123');

//       expect(result).toHaveProperty('id');
//       expect(dataSource.query).toHaveBeenCalledTimes(2);
//     });

//     it('should throw ConflictException for time overlap', async () => {
//       const createDto = {
//         patientId: 'patient-123',
//         professionalId: 'pro-123',
//         startTime: new Date('2024-01-15 10:00'),
//         endTime: new Date('2024-01-15 10:30'),
//         procedureType: 'consultation',
//         origin: 'in_person',
//       };

//       const conflictingSchedule = {
//         id: 'sched-existing',
//         startTime: new Date('2024-01-15 10:15'),
//         endTime: new Date('2024-01-15 10:45'),
//       };

//       jest.spyOn(dataSource, 'query').mockResolvedValue([conflictingSchedule]);

//       await expect(service.create(createDto, 'user-123')).rejects.toThrow(
//         ConflictException
//       );
//     });

//     it('should not conflict with adjacent schedules', async () => {
//       const createDto = {
//         patientId: 'patient-123',
//         professionalId: 'pro-123',
//         startTime: new Date('2024-01-15 10:30'),
//         endTime: new Date('2024-01-15 11:00'),
//         procedureType: 'consultation',
//         origin: 'in_person',
//       };

//       const adjacentSchedule = {
//         id: 'sched-before',
//         startTime: new Date('2024-01-15 10:00'),
//         endTime: new Date('2024-01-15 10:30'),
//       };

//       jest.spyOn(dataSource, 'query').mockResolvedValueOnce([adjacentSchedule]);
//       jest.spyOn(dataSource, 'query').mockResolvedValueOnce([{ id: 'new-sched' }]);

//       const result = await service.create(createDto, 'user-123');

//       expect(result).toHaveProperty('id');
//     });
//   });

//   describe('getAvailability', () => {
//     it('should return available slots for a date', async () => {
//       jest.spyOn(dataSource, 'query').mockResolvedValue([]);

//       const availability = await service.getAvailability(
//         'pro-123',
//         '2024-01-15',
//         30
//       );

//       expect(availability).toBeDefined();
//       expect(Array.isArray(availability)).toBe(true);
//       expect(availability.length).toBeGreaterThan(0);
//       if (availability.length > 0) {
//         expect(availability[0]).toHaveProperty('time');
//         expect(availability[0]).toHaveProperty('available');
//       }
//     });

//     it('should mark booked slots as unavailable', async () => {
//       const bookedSchedule = {
//         id: 'sched-1',
//         startTime: new Date('2024-01-15 10:00'),
//         endTime: new Date('2024-01-15 10:30'),
//       };

//       jest.spyOn(dataSource, 'query').mockResolvedValue([bookedSchedule]);

//       const availability = await service.getAvailability(
//         'pro-123',
//         '2024-01-15',
//         30
//       );

//       const slot10am = availability.find((slot) => slot.time === '10:00');
//       if (slot10am) {
//         expect(slot10am.available).toBe(false);
//       }
//     });

//     it('should generate correct 30-minute slots', async () => {
//       jest.spyOn(dataSource, 'query').mockResolvedValue([]);

//       const availability = await service.getAvailability(
//         'pro-123',
//         '2024-01-15',
//         30
//       );

//       expect(availability.length).toBe(20);
//       if (availability.length > 0) {
//         expect(availability[0].time).toBe('08:00');
//         expect(availability[availability.length - 1].time).toBe('17:30');
//       }
//     });
//   });

//   describe('findOne', () => {
//     it('should return schedule by id', async () => {
//       const schedule = { id: 'sched-123', patientId: 'patient-123', status: 'scheduled' };
//       jest.spyOn(dataSource, 'query').mockResolvedValue([schedule]);

//       const result = await service.findOne('sched-123', 'user-123');

//       expect(result).toEqual(schedule);
//     });

//     it('should throw NotFoundException if schedule not found', async () => {
//       jest.spyOn(dataSource, 'query').mockResolvedValue([]);

//       await expect(service.findOne('invalid-id', 'user-123')).rejects.toThrow(
//         NotFoundException
//       );
//     });
//   });

//   describe('updateStatus', () => {
//     it('should update schedule status with valid transition', async () => {
//       const existingSchedule = { id: 'sched-123', status: 'scheduled' };
//       const updatedSchedule = { id: 'sched-123', status: 'confirmed' };

//       jest.spyOn(dataSource, 'query').mockResolvedValueOnce([existingSchedule]);
//       jest.spyOn(dataSource, 'query').mockResolvedValueOnce([updatedSchedule]);
//       jest.spyOn(cacheManager, 'del').mockResolvedValue(undefined);

//       const result = await service.updateStatus(
//         'sched-123',
//         { status: 'confirmed' },
//         'user-123'
//       );

//       expect(result.status).toBe('confirmed');
//       expect(cacheManager.del).toHaveBeenCalled();
//     });

//     it('should prevent invalid status transitions', async () => {
//       const completedSchedule = { id: 'sched-123', status: 'completed' };
      
//       jest.spyOn(dataSource, 'query').mockResolvedValue([completedSchedule]);

//       await expect(
//         service.updateStatus(
//           'sched-123',
//           { status: 'scheduled' },
//           'user-123'
//         )
//       ).rejects.toThrow();
//     });
//   });

//   describe('remove', () => {
//     it('should delete schedule and invalidate cache', async () => {
//       const existingSchedule = { id: 'sched-123', status: 'scheduled' };
      
//       jest.spyOn(dataSource, 'query').mockResolvedValueOnce([existingSchedule]);
//       jest.spyOn(dataSource, 'query').mockResolvedValueOnce([]);
//       jest.spyOn(cacheManager, 'del').mockResolvedValue(undefined);

//       const result = await service.remove('sched-123', 'user-123');

//       expect(result).toHaveProperty('message');
//       expect(cacheManager.del).toHaveBeenCalled();
//     });
//   });
// });