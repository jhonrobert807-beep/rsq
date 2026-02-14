import {
  IsString,
  IsEmail,
  IsOptional,
  IsEnum,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Role } from '@prisma/client';

export class RegisterDto {
  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @MinLength(2)
  name: string;

  @ApiPropertyOptional({ example: 'john@example.com' })
  @ValidateIf((o) => !o.phone)
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email?: string;

  @ApiPropertyOptional({ example: '+923001234567' })
  @ValidateIf((o) => !o.email)
  @IsString({ message: 'Please provide a valid phone number' })
  phone?: string;

  @ApiProperty({ example: 'StrongP@ss1', minLength: 8 })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  password: string;

  @ApiPropertyOptional({
    enum: [Role.USER, Role.DRIVER, Role.PARAMEDIC],
    default: Role.USER,
    description: 'Self-registration is allowed for USER, DRIVER, PARAMEDIC only',
  })
  @IsOptional()
  @IsEnum([Role.USER, Role.DRIVER, Role.PARAMEDIC], {
    message: 'Role must be USER, DRIVER, or PARAMEDIC',
  })
  role?: Role;
}
