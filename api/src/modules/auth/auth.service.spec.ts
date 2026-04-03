// import { Test, TestingModule } from '@nestjs/testing';
// import { AuthService } from './auth.service';
// import { JwtService } from '@nestjs/jwt';
// import { ConfigService } from '@nestjs/config';
// import { DataSource } from 'typeorm';
// import * as bcrypt from 'bcrypt';
// import { UnauthorizedException } from '@nestjs/common';

// describe('AuthService', () => {
//   let service: AuthService;
//   let jwtService: JwtService;
//   let configService: ConfigService;
//   let dataSource: DataSource;

//   beforeEach(async () => {
//     const module: TestingModule = await Test.createTestingModule({
//       providers: [
//         AuthService,
//         {
//           provide: JwtService,
//           useValue: {
//             sign: jest.fn(),
//             verify: jest.fn(),
//           },
//         },
//         {
//           provide: ConfigService,
//           useValue: {
//             get: jest.fn(),
//           },
//         },
//         {
//           provide: DataSource,
//           useValue: {
//             query: jest.fn(),
//           },
//         },
//       ],
//     }).compile();

//     service = module.get<AuthService>(AuthService);
//     jwtService = module.get<JwtService>(JwtService);
//     configService = module.get<ConfigService>(ConfigService);
//     dataSource = module.get<DataSource>(DataSource);
//   });

//   describe('login', () => {
//     it('should return access and refresh tokens on successful login', async () => {
//       const email = 'test@example.com';
//       const password = 'password123';
//       const tenantId = 'tenant-123';

//       const hashedPassword = await bcrypt.hash(password, 10);
//       const user = {
//         id: 'user-123',
//         email,
//         password_hash: hashedPassword,
//         tenant_id: tenantId,
//         role: 'admin',
//       };

//       jest.spyOn(dataSource, 'query').mockResolvedValue([user]);
//       jest.spyOn(jwtService, 'sign').mockReturnValue('mock-token');

//       const result = await service.login(email, password, tenantId);

//       expect(result).toHaveProperty('accessToken');
//       expect(result).toHaveProperty('refreshToken');
//       expect(result).toHaveProperty('user');
//       expect(dataSource.query).toHaveBeenCalled();
//     });

//     it('should throw UnauthorizedException for invalid credentials', async () => {
//       jest.spyOn(dataSource, 'query').mockResolvedValue([]);

//       await expect(
//         service.login('test@example.com', 'wrongpassword', 'tenant-123')
//       ).rejects.toThrow(UnauthorizedException);
//     });

//     it('should throw error for incorrect password', async () => {
//       const email = 'test@example.com';
//       const password = 'password123';
//       const tenantId = 'tenant-123';

//       const hashedPassword = await bcrypt.hash('differentpassword', 10);
//       const user = {
//         id: 'user-123',
//         email,
//         password_hash: hashedPassword,
//         tenant_id: tenantId,
//         role: 'admin',
//       };

//       jest.spyOn(dataSource, 'query').mockResolvedValue([user]);

//       await expect(
//         service.login(email, password, tenantId)
//       ).rejects.toThrow(UnauthorizedException);
//     });
//   });

//   describe('refreshAccessToken', () => {
//     it('should return new access token with valid refresh token', async () => {
//       const refreshToken = 'valid-refresh-token';
//       const payload = {
//         sub: 'user-123',
//         email: 'test@example.com',
//         tenantId: 'tenant-123',
//         role: 'admin',
//       };

//       jest.spyOn(jwtService, 'verify').mockReturnValue(payload);
//       jest.spyOn(jwtService, 'sign').mockReturnValue('new-access-token');

//       const result = await service.refreshAccessToken(refreshToken);

//       expect(result).toBe('new-access-token');
//       expect(jwtService.verify).toHaveBeenCalled();
//     });

//     it('should throw error for invalid refresh token', async () => {
//       jest.spyOn(jwtService, 'verify').mockImplementation(() => {
//         throw new Error('Invalid token');
//       });

//       await expect(
//         service.refreshAccessToken('invalid-token')
//       ).rejects.toThrow('Invalid token');
//     });
//   });

//   describe('validateToken', () => {
//     it('should return decoded token for valid JWT', async () => {
//       const token = 'valid-token';
//       const payload = {
//         sub: 'user-123',
//         email: 'test@example.com',
//         tenantId: 'tenant-123',
//         role: 'admin',
//       };

//       jest.spyOn(jwtService, 'verify').mockReturnValue(payload);

//       const result = await service.validateToken(token);

//       expect(result).toEqual(payload);
//     });

//     it('should throw error for invalid token', async () => {
//       jest.spyOn(jwtService, 'verify').mockImplementation(() => {
//         throw new Error('Invalid signature');
//       });

//       await expect(
//         service.validateToken('invalid-token')
//       ).rejects.toThrow('Invalid signature');
//     });
//   });
// });