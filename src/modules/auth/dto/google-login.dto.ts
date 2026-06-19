import { IsString, IsEnum, IsOptional } from 'class-validator';
import { Role } from '@prisma/client';

export class GoogleLoginDto {
  @IsString()
  idToken: string;

  @IsEnum(Role)
  @IsOptional()
  role?: Role;
}
