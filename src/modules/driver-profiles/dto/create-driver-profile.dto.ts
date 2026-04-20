import { IsUUID, IsOptional, IsInt, IsString, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateDriverProfileDto {
  @ApiProperty({ description: 'User ID (must have DRIVER role)' })
  @IsUUID()
  userId: string;

  @ApiPropertyOptional({ example: 'LHR-DL-123456' })
  @IsOptional()
  @IsString()
  licenseNumber?: string;

  @ApiPropertyOptional({ example: 3 })
  @IsOptional()
  @IsInt()
  @Min(0)
  experienceYears?: number;

  @ApiPropertyOptional({ example: 'Clean driving record' })
  @IsOptional()
  @IsString()
  notes?: string;
}
