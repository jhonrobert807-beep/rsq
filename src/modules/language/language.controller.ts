import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { LanguageService } from './language.service';
import { SetLanguagePreferenceDto } from './dto/set-language-preference.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Language')
@Controller('languages')
export class LanguageController {
  constructor(private readonly languageService: LanguageService) {}

  @Get()
  @ApiOperation({ summary: 'Get all available languages' })
  @ApiResponse({ status: 200, description: 'List of available languages' })
  getAvailableLanguages() {
    return this.languageService.getAvailableLanguages();
  }

  @Get(':code/translations')
  @ApiOperation({ summary: 'Get translations for a specific language' })
  @ApiResponse({ status: 200, description: 'Translations for language' })
  @ApiResponse({ status: 404, description: 'Language not found' })
  getTranslations(@Param('code') code: string) {
    return this.languageService.getTranslations(code);
  }

  @Get('user/:userId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user language preference' })
  @ApiResponse({ status: 200, description: 'User language preference' })
  getUserLanguagePreference(@Param('userId') userId: string) {
    return this.languageService.getUserLanguagePreference(userId);
  }

  @Patch('user/:userId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Set user language preference' })
  @ApiResponse({ status: 200, description: 'Language preference updated' })
  @ApiResponse({ status: 404, description: 'User not found' })
  setUserLanguagePreference(
    @Param('userId') userId: string,
    @Body() dto: SetLanguagePreferenceDto,
  ) {
    return this.languageService.setUserLanguagePreference(userId, dto.language);
  }
}
