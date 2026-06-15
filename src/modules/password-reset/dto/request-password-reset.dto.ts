import { IsString, IsEmail, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RequestPasswordResetDto {
  @ApiProperty({
    example: 'user@example.com or +1234567890',
    description: 'Email or phone number of the user',
  })
  @IsString()
  emailOrPhone: string;
}
