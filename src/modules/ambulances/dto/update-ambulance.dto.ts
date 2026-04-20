import { IsString, IsOptional, IsEnum, IsNumber, IsUUID } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { AmbulanceType, AmbulanceStatus } from '@prisma/client';

export class UpdateAmbulanceDto {
  @ApiPropertyOptional({ example: 'KHI-AMB-001' })
  @IsOptional()
  @IsString()
  registrationNumber?: string;

  @ApiPropertyOptional({ enum: AmbulanceType })
  @IsOptional()
  @IsEnum(AmbulanceType)
  type?: AmbulanceType;

  @ApiPropertyOptional({ enum: AmbulanceStatus })
  @IsOptional()
  @IsEnum(AmbulanceStatus)
  status?: AmbulanceStatus;

  @ApiPropertyOptional({ example: 24.8607 })
  @IsOptional()
  @IsNumber()
  currentLat?: number;

  @ApiPropertyOptional({ example: 67.0011 })
  @IsOptional()
  @IsNumber()
  currentLng?: number;

  @ApiPropertyOptional({ description: 'Organization ID' })
  @IsOptional()
  @IsUUID()
  organizationId?: string;
}
