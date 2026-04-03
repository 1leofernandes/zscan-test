import { IsEmail, IsString, MinLength, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'user@clinic.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'password123', minLength: 8 })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  password!: string;

  @ApiProperty({ required: false, description: 'Tenant ID (for super admin login)' })
  @IsOptional()
  @IsUUID()
  tenantId?: string;
}

export class RefreshTokenDto {
  @ApiProperty({ description: 'Refresh token from login' })
  @IsString()
  refreshToken!: string;
}

export class SignUpDto extends LoginDto {
  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @MinLength(3)
  name!: string;
}

export class AuthResponseDto {
  @ApiProperty()
  accessToken: string = '';

  @ApiProperty()
  refreshToken: string = '';

  @ApiProperty()
  expiresIn: number = 0;

  @ApiProperty()
  tenantId?: string;

  @ApiProperty()
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
  } = { id: '', email: '', name: '', role: '' };
}
