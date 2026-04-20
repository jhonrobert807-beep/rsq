import { IsString, IsOptional, IsEnum, IsUUID, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AmbulanceType, AmbulanceStatus } from '@prisma/client';

export class CreateAmbulanceDto {
  @ApiPropertyOptional({ example: 'KHI-AMB-001' })
  @IsOptional()
  @IsString()
  registrationNumber?: string;

  @ApiPropertyOptional({ enum: AmbulanceType, default: AmbulanceType.BASIC })
  @IsOptional()
  @IsEnum(AmbulanceType)
  type?: AmbulanceType;

  @ApiPropertyOptional({ enum: AmbulanceStatus, default: AmbulanceStatus.AVAILABLE })
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

  @ApiProperty({ description: 'Organization ID' })
  @IsUUID()
  organizationId: string;
}
