import { IsString, IsEmail, IsOptional, MinLength, ValidateIf } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LoginDto {
  @ApiPropertyOptional({ example: 'john@example.com' })
  @ValidateIf((o) => !o.phone)
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email?: string;

  @ApiPropertyOptional({ example: '+923001234567' })
  @ValidateIf((o) => !o.email)
  @IsString({ message: 'Please provide a valid phone number' })
  phone?: string;

  @ApiProperty({ example: 'StrongP@ss1' })
  @IsString()
  @MinLength(1, { message: 'Password is required' })
  password: string;
}
