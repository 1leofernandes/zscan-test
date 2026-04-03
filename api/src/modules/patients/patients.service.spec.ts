// import { Test, TestingModule } from '@nestjs/testing';
// import { PatientsService } from './patients.service';
// import { DataSource } from 'typeorm';
// import { CACHE_MANAGER } from '@nestjs/cache-manager';
// import { BadRequestException, NotFoundException, ConflictException } from '@nestjs/common';

// describe('PatientsService', () => {
//   let service: PatientsService;
//   let dataSource: DataSource;
//   let cacheManager: any;

//   beforeEach(async () => {
//     const module: TestingModule = await Test.createTestingModule({
//       providers: [
//         PatientsService,
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

//     service = module.get<PatientsService>(PatientsService);
//     dataSource = module.get<DataSource>(DataSource);
//     cacheManager = module.get(CACHE_MANAGER);
//   });

//   describe('create', () => {
//     it('should create a new patient with valid data', async () => {
//       const createDto = {
//         fullName: 'João Silva',
//         dateOfBirth: '1990-01-15',
//         cpf: '12345678901',
//         cns: '123456789012345',
//         gender: 'M',
//         phonePrimary: '11987654321',
//         phoneSecondary: '1133334444',
//         email: 'joao@example.com',
//         address: {
//           cep: '01234567',
//           street: 'Rua das Flores',
//           number: '123',
//           neighborhood: 'Centro',
//           city: 'São Paulo',
//           state: 'SP',
//         },
//         healthPlanId: 'unimed-001',
//       };

//       const createdPatient = { id: 'patient-123', ...createDto };
//       jest.spyOn(dataSource, 'query').mockResolvedValueOnce([]); // No duplicate CPF
//       jest.spyOn(dataSource, 'query').mockResolvedValueOnce([createdPatient]); // Insert

//       const result = await service.create(createDto, 'tenant_schema', 'user-123');

//       expect(result.id).toEqual('patient-123');
//       expect(dataSource.query).toHaveBeenCalled();
//     });

//     it('should throw BadRequestException for duplicate CPF', async () => {
//       const createDto = {
//         fullName: 'João Silva',
//         cpf: '12345678901',
//         dateOfBirth: '1990-01-15',
//         gender: 'M',
//         phonePrimary: '11987654321',
//         address: { 
//           cep: '01234567', 
//           street: 'Rua', 
//           number: '1', 
//           neighborhood: 'Centro', 
//           city: 'SP', 
//           state: 'SP' 
//         },
//       };

//       // Mock existing patient with same CPF
//       jest.spyOn(dataSource, 'query').mockResolvedValueOnce([{ cpf: '12345678901' }]);

//       await expect(service.create(createDto, 'tenant_schema', 'user-123')).rejects.toThrow(
//         BadRequestException
//       );
//     });

//     it('should throw error for invalid age (> 150)', async () => {
//       const futureDate = new Date();
//       futureDate.setFullYear(futureDate.getFullYear() + 10);

//       const createDto = {
//         fullName: 'Invalid Age',
//         cpf: '12345678901',
//         dateOfBirth: futureDate.toISOString(),
//         gender: 'M',
//         phonePrimary: '11987654321',
//         address: { 
//           cep: '01234567', 
//           street: 'Rua', 
//           number: '1', 
//           neighborhood: 'Centro', 
//           city: 'SP', 
//           state: 'SP' 
//         },
//       };

//       await expect(service.create(createDto, 'tenant_schema', 'user-123')).rejects.toThrow(
//         BadRequestException
//       );
//     });
//   });

//   describe('findAll', () => {
//     it('should return paginated patients', async () => {
//       const patients = [
//         { id: 'p1', fullName: 'João', cpf: '12345678901' },
//         { id: 'p2', fullName: 'Maria', cpf: '98765432101' },
//       ];

//       jest.spyOn(dataSource, 'query').mockResolvedValueOnce(patients);
//       jest.spyOn(dataSource, 'query').mockResolvedValueOnce([{ count: '2' }]);
//       jest.spyOn(cacheManager, 'get').mockResolvedValue(null);

//       const result = await service.findAll('tenant_schema', 1, 10);

//       expect(result.items.length).toBeGreaterThanOrEqual(0);
//       expect(result.page).toBe(1);
//       expect(result.pageSize).toBe(10);
//     });

//     it('should return cached results if available', async () => {
//       const cachedData = { 
//         items: [], 
//         total: 0, 
//         page: 1, 
//         pageSize: 10,
//         hasMore: false 
//       };
//       jest.spyOn(cacheManager, 'get').mockResolvedValue(cachedData);

//       const result = await service.findAll('tenant_schema', 1, 10);

//       expect(result).toEqual(cachedData);
//       expect(cacheManager.get).toHaveBeenCalled();
//     });

//     it('should search patients by CPF', async () => {
//       const patients = [
//         { id: 'p1', fullName: 'João', cpf: '12345678901' },
//       ];

//       jest.spyOn(dataSource, 'query').mockResolvedValueOnce(patients);
//       jest.spyOn(dataSource, 'query').mockResolvedValueOnce([{ count: '1' }]);
//       jest.spyOn(cacheManager, 'get').mockResolvedValue(null);

//       const result = await service.findAll('tenant_schema', 1, 10, undefined, '12345678901');

//       expect(result.items.length).toBeGreaterThanOrEqual(0);
//       expect(dataSource.query).toHaveBeenCalled();
//     });
//   });

//   describe('findOne', () => {
//     it('should return patient by ID', async () => {
//       const patient = { id: 'p1', fullName: 'João', cpf: '12345678901' };
//       jest.spyOn(dataSource, 'query').mockResolvedValue([patient]);

//       const result = await service.findOne('p1', 'tenant_schema');

//       expect(result).toEqual(patient);
//     });

//     it('should throw NotFoundException for non-existent patient', async () => {
//       jest.spyOn(dataSource, 'query').mockResolvedValue([]);

//       await expect(service.findOne('non-existent', 'tenant_schema')).rejects.toThrow(
//         NotFoundException
//       );
//     });
//   });

//   describe('update', () => {
//     it('should update patient data', async () => {
//       const updateDto = { fullName: 'João Silva Updated' };
//       const existingPatient = {
//         id: 'p1',
//         fullName: 'João Silva',
//         cpf: '12345678901',
//       };
//       const updatedPatient = {
//         id: 'p1',
//         fullName: 'João Silva Updated',
//         cpf: '12345678901',
//       };

//       jest.spyOn(dataSource, 'query').mockResolvedValueOnce([existingPatient]);
//       jest.spyOn(dataSource, 'query').mockResolvedValueOnce([updatedPatient]);
//       jest.spyOn(cacheManager, 'del').mockResolvedValue(undefined);

//       const result = await service.update('p1', 'tenant_schema', updateDto, 'user-123');

//       expect(result.fullName).toBe('João Silva Updated');
//       expect(cacheManager.del).toHaveBeenCalled();
//     });
//   });

//   describe('remove', () => {
//     it('should soft delete patient', async () => {
//       const existingPatient = { id: 'p1', fullName: 'João Silva' };
      
//       jest.spyOn(dataSource, 'query').mockResolvedValueOnce([existingPatient]);
//       jest.spyOn(dataSource, 'query').mockResolvedValueOnce([]);
//       jest.spyOn(cacheManager, 'del').mockResolvedValue(undefined);

//       await service.remove('p1', 'tenant_schema', 'user-123');

//       expect(cacheManager.del).toHaveBeenCalled();
//     });
//   });
// });