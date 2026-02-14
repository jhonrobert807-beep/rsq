import { IsNumber, IsOptional, IsEnum, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AmbulanceType } from '@prisma/client';

export class DispatchRequestDto {
  @ApiProperty({ description: 'Ride request ID to dispatch' })
  @IsUUID()
  rideRequestId: string;

  @ApiPropertyOptional({ enum: AmbulanceType })
  @IsOptional()
  @IsEnum(AmbulanceType)
  ambulanceType?: AmbulanceType;

  @ApiPropertyOptional({ example: 10, description: 'Max search radius in km (default 10)' })
  @IsOptional()
  @IsNumber()
  radiusKm?: number;
}
