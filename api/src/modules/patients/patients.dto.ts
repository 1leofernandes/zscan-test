import {
  IsString,
  IsEmail,
  IsPhoneNumber,
  IsEnum,
  IsOptional,
  IsDateString,
  IsObject,
  ValidateNested,
  MinLength,
  MaxLength,
  Matches,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';

class AddressDto {
  @ApiProperty({ example: '12345-678' })
  @Matches(/^\d{5}-\d{3}$/, { message: 'Invalid CEP format' })
  cep!: string;

  @ApiProperty({ example: 'Rua Principal' })
  @IsString()
  street!: string;

  @ApiProperty({ example: '123' })
  @IsString()
  number!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  complement?: string;

  @ApiProperty({ example: 'Centro' })
  @IsString()
  neighborhood!: string;

  @ApiProperty({ example: 'São Paulo' })
  @IsString()
  city!: string;

  @ApiProperty({ example: 'SP', minLength: 2, maxLength: 2 })
  @IsString()
  @MinLength(2)
  @MaxLength(2)
  state!: string;
}

export class CreatePatientDto {
  @ApiProperty({ example: 'João da Silva', minLength: 3, maxLength: 100 })
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  fullName!: string;

  @ApiProperty({ example: '1990-01-15' })
  @IsDateString()
  dateOfBirth!: string;

  @ApiProperty({ example: '12345678901', description: 'CPF sem formatação' })
  @IsString()
  @Matches(/^\d{11}$/, { message: 'CPF must have 11 digits' })
  cpf!: string;

  @ApiProperty({ required: false, example: '123456789012345' })
  @IsOptional()
  @IsString()
  @Matches(/^\d{15}$/, { message: 'CNS must have 15 digits' })
  cns?: string;

  @ApiProperty({ enum: ['M', 'F', 'O'] })
  @IsEnum(['M', 'F', 'O'])
  gender!: 'M' | 'F' | 'O';

  @ApiProperty({ example: '11999999999' })
  @IsString()
  @Matches(/^\d{10,11}$/, { message: 'Invalid phone format' })
  phonePrimary!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  phoneSecondary?: string;

  @ApiProperty({ required: false, example: 'patient@email.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ type: AddressDto })
  @ValidateNested()
  @Type(() => AddressDto)
  address!: AddressDto;

  @ApiProperty({ required: false, description: 'Health plan ID' })
  @IsOptional()
  @IsString()
  healthPlanId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  clinicalNotes?: string;
}

export class UpdatePatientDto extends PartialType(CreatePatientDto) {}

export class PatientResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  fullName!: string;

  @ApiProperty()
  cpf!: string;

  @ApiProperty({ required: false })
  cns?: string;

  @ApiProperty()
  dateOfBirth!: Date;

  @ApiProperty()
  gender!: string;

  @ApiProperty()
  phonePrimary!: string;

  @ApiProperty({ required: false })
  phoneSecondary?: string;

  @ApiProperty({ required: false })
  email?: string;

  @ApiProperty()
  address!: {
    cep: string;
    street: string;
    number: string;
    neighborhood: string;
    city: string;
    state: string;
    complement?: string;
  };

  @ApiProperty({ required: false })
  healthPlanId?: string;

  @ApiProperty()
  isActive!: boolean;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;

  @ApiProperty()
  createdBy!: string;
}

export class PatientsListDto {
  @ApiProperty()
  items!: PatientResponseDto[];

  @ApiProperty()
  total!: number;

  @ApiProperty()
  page!: number;

  @ApiProperty()
  pageSize!: number;

  @ApiProperty()
  hasMore!: boolean;
}
