import { IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ReassignRideDto {
  @ApiProperty({ description: 'New ambulance ID to assign' })
  @IsUUID()
  ambulanceId: string;
}
