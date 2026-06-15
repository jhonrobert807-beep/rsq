import { IsString, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SetLanguagePreferenceDto {
  @ApiProperty({
    example: 'en',
    description: 'Language code (en, es, fr, de, pt, ar)',
    enum: ['en', 'es', 'fr', 'de', 'pt', 'ar'],
  })
  @IsString()
  @IsIn(['en', 'es', 'fr', 'de', 'pt', 'ar'])
  language: string;
}
