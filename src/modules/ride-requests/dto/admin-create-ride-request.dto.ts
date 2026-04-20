import { IsEnum, IsNumber, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AmbulanceType } from '@prisma/client';

export class AdminCreateRideRequestDto {
  @ApiProperty({ description: 'Patient user ID (role=USER)' })
  @IsUUID()
  userId: string;

  @ApiProperty({ enum: AmbulanceType, default: AmbulanceType.BASIC })
  @IsEnum(AmbulanceType)
  ambulanceType: AmbulanceType;

  @ApiProperty({ example: 24.8607 })
  @IsNumber()
  pickupLat: number;

  @ApiProperty({ example: 67.0011 })
  @IsNumber()
  pickupLng: number;

  @ApiPropertyOptional({ example: 24.87 })
  @IsOptional()
  @IsNumber()
  destinationLat?: number;

  @ApiPropertyOptional({ example: 67.02 })
  @IsOptional()
  @IsNumber()
  destinationLng?: number;
}
