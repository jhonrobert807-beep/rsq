import { IsBoolean, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateNotificationPreferencesDto {
  @ApiProperty({
    example: true,
    description: 'Receive notifications about ride updates',
  })
  @IsOptional()
  @IsBoolean()
  rideUpdates?: boolean;

  @ApiProperty({
    example: false,
    description: 'Receive promotional notifications',
  })
  @IsOptional()
  @IsBoolean()
  promotions?: boolean;

  @ApiProperty({
    example: true,
    description: 'Receive safety alert notifications',
  })
  @IsOptional()
  @IsBoolean()
  safetyAlerts?: boolean;

  @ApiProperty({
    example: true,
    description: 'Receive payment reminder notifications',
  })
  @IsOptional()
  @IsBoolean()
  paymentReminders?: boolean;

  @ApiProperty({
    example: true,
    description: 'Receive system notifications',
  })
  @IsOptional()
  @IsBoolean()
  systemNotifications?: boolean;
}
