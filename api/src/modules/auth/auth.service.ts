import { Injectable, UnauthorizedException, Logger, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { LoginDto, AuthResponseDto } from './auth.dto';
import { IJwtPayload, UserRole } from '../../common/interfaces/context.interface';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly dataSource: DataSource,
  ) {}

  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    const { email, password, tenantId } = loginDto;

    // Find user
    const queryRunner = this.dataSource.createQueryRunner();
    try {
      let user;
      
      if (tenantId) {
        // Super admin login with specific tenant
        user = await queryRunner.query(
          `SELECT id, email, name, password_hash, role, tenant_id FROM public.users WHERE email = $1`,
          [email],
        );
      } else {
        // Regular tenant user login
        user = await queryRunner.query(
          `SELECT id, email, name, password_hash, role, tenant_id FROM public.users WHERE email = $1`,
          [email],
        );
      }

      if (!user || user.length === 0) {
        throw new UnauthorizedException('Invalid credentials');
      }

      const userRecord = user[0];

      // Verify password - Aceita tanto bcrypt quanto texto puro
      let isPasswordValid = false;
      
      // Tenta comparar como bcrypt primeiro
      try {
        isPasswordValid = await bcrypt.compare(password, userRecord.password_hash);
      } catch {
        // Se falhar (ex: hash inválido), compara como texto puro
        isPasswordValid = password === userRecord.password_hash;
      }
      
      // Se ainda não for válido, tenta comparar diretamente (para senhas em texto puro)
      if (!isPasswordValid) {
        isPasswordValid = password === userRecord.password_hash;
      }
      
      if (!isPasswordValid) {
        this.logger.warn(`Invalid password for user: ${email}`);
        throw new UnauthorizedException('Invalid credentials');
      }

      // Generate tokens
      const payload: IJwtPayload = {
        sub: userRecord.id,
        email: userRecord.email,
        tenantId: userRecord.tenant_id || tenantId,
        role: userRecord.role,
      };

      const accessToken = this.jwtService.sign(payload, {
        expiresIn: this.configService.get<string>('JWT_EXPIRATION', '3600s'),
      });

      const refreshToken = this.jwtService.sign(payload, {
        expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRATION', '604800s'),
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });

      // Update last login
      await queryRunner.query(
        `UPDATE public.users SET last_login = NOW() WHERE id = $1`,
        [userRecord.id],
      );

      this.logger.log(`User ${email} logged in successfully`);

      return {
        accessToken,
        refreshToken,
        expiresIn: parseInt(this.configService.get<string>('JWT_EXPIRATION', '3600')),
        tenantId: userRecord.tenant_id || tenantId,
        user: {
          id: userRecord.id,
          email: userRecord.email,
          name: userRecord.name,
          role: userRecord.role,
        },
      };
    } finally {
      await queryRunner.release();
    }
  }

  async refreshAccessToken(refreshToken: string): Promise<AuthResponseDto> {
    try {
      const payload = this.jwtService.verify<IJwtPayload>(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });

      const queryRunner = this.dataSource.createQueryRunner();
      try {
        const user = await queryRunner.query(
          `SELECT id, email, name, role, is_active FROM public.users WHERE id = $1`,
          [payload.sub],
        );

        if (!user || user.length === 0 || !user[0].is_active) {
          throw new UnauthorizedException('User not found or inactive');
        }

        const userRecord = user[0];

        // Generate new access token
        const newPayload: IJwtPayload = {
          sub: userRecord.id,
          email: userRecord.email,
          tenantId: payload.tenantId,
          role: userRecord.role,
        };

        const newAccessToken = this.jwtService.sign(newPayload, {
          expiresIn: this.configService.get<string>('JWT_EXPIRATION', '3600s'),
        });

        return {
          accessToken: newAccessToken,
          refreshToken: refreshToken, // Return same refresh token
          expiresIn: parseInt(this.configService.get<string>('JWT_EXPIRATION', '3600')),
          user: {
            id: userRecord.id,
            email: userRecord.email,
            name: userRecord.name,
            role: userRecord.role,
          },
        };
      } finally {
        await queryRunner.release();
      }
    } catch (error) {
      this.logger.error(`Refresh token error: ${error instanceof Error ? error.message : String(error)}`);
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }
}