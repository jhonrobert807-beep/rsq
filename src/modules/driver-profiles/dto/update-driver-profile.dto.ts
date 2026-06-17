import { IsOptional, IsInt, IsString, IsEnum, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { RegistrationStatus } from '@prisma/client';

export class UpdateDriverProfileDto {
  @ApiPropertyOptional({ example: 'LHR-DL-123456' })
  @IsOptional()
  @IsString()
  licenseNumber?: string;

  @ApiPropertyOptional({ example: 5 })
  @IsOptional()
  @IsInt()
  @Min(0)
  experienceYears?: number;

  @ApiPropertyOptional({ enum: RegistrationStatus })
  @IsOptional()
  @IsEnum(RegistrationStatus)
  status?: RegistrationStatus;

  @ApiPropertyOptional({ example: 'Updated notes' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ example: 'Ahmed Driver' })
  @IsOptional()
  @IsString()
  vehicleOwner?: string;

  @ApiPropertyOptional({ example: 'KA-01-SS-0128' })
  @IsOptional()
  @IsString()
  vehicleRegistrationNumber?: string;

  @ApiPropertyOptional({ example: 'Express Ambulance' })
  @IsOptional()
  @IsString()
  vehicleType?: string;

  @ApiPropertyOptional({ example: 'Karachi, Pakistan' })
  @IsOptional()
  @IsString()
  vehicleCity?: string;

  @ApiPropertyOptional({ example: 'Male' })
  @IsOptional()
  @IsString()
  gender?: string;

  @ApiPropertyOptional({ example: 'Pakistan' })
  @IsOptional()
  @IsString()
  country?: string;
}
