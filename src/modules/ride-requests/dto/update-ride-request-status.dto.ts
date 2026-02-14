import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RideRequestStatus } from '@prisma/client';

export class UpdateRideRequestStatusDto {
  @ApiProperty({ enum: RideRequestStatus })
  @IsEnum(RideRequestStatus)
  status: RideRequestStatus;

  @ApiPropertyOptional({ description: 'Ambulance to assign' })
  @IsOptional()
  @IsUUID()
  ambulanceId?: string;

  @ApiPropertyOptional({ description: 'Driver to assign' })
  @IsOptional()
  @IsUUID()
  assignedDriverId?: string;

  @ApiPropertyOptional({ description: 'Paramedic to assign' })
  @IsOptional()
  @IsUUID()
  assignedParamedicId?: string;
}
