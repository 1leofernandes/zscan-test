import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly dataSource: DataSource,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  async validate(payload: any) {
    const queryRunner = this.dataSource.createQueryRunner();
    try {
      const users = await queryRunner.query(
        `SELECT id, email, role, is_active FROM public.users WHERE id = $1`,
        [payload.sub],
      );

      if (!users || users.length === 0 || !users[0].is_active) {
        throw new UnauthorizedException('User not found or inactive');
      }

      const user = users[0];
      
      return {
        id: user.id,
        email: user.email,
        role: user.role,
        tenantId: payload.tenantId,
      };
    } finally {
      await queryRunner.release();
    }
  }
}