import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyResetCodeDto {
  @ApiProperty({
    example: 'user@example.com or +1234567890',
    description: 'Email or phone number',
  })
  @IsString()
  emailOrPhone: string;

  @ApiProperty({
    example: '123456',
    description: 'OTP code sent to user',
  })
  @IsString()
  code: string;
}
