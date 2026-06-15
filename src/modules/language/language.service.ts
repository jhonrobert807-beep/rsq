import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

// Sample translations - in production, load from file or database
const LANGUAGES = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'es', name: 'Spanish', nativeName: 'Español' },
  { code: 'fr', name: 'French', nativeName: 'Français' },
  { code: 'de', name: 'German', nativeName: 'Deutsch' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية' },
];

const TRANSLATIONS: Record<string, Record<string, string>> = {
  en: {
    'app.title': 'ResqLink',
    'app.description': 'Emergency Medical Services',
    'home.welcome': 'Welcome to ResqLink',
    'button.submit': 'Submit',
    'button.cancel': 'Cancel',
  },
  es: {
    'app.title': 'ResqLink',
    'app.description': 'Servicios Médicos de Emergencia',
    'home.welcome': 'Bienvenido a ResqLink',
    'button.submit': 'Enviar',
    'button.cancel': 'Cancelar',
  },
  fr: {
    'app.title': 'ResqLink',
    'app.description': 'Services Médicaux d\'Urgence',
    'home.welcome': 'Bienvenue à ResqLink',
    'button.submit': 'Soumettre',
    'button.cancel': 'Annuler',
  },
  de: {
    'app.title': 'ResqLink',
    'app.description': 'Notfalldienste',
    'home.welcome': 'Willkommen bei ResqLink',
    'button.submit': 'Absenden',
    'button.cancel': 'Abbrechen',
  },
  pt: {
    'app.title': 'ResqLink',
    'app.description': 'Serviços Médicos de Emergência',
    'home.welcome': 'Bem-vindo ao ResqLink',
    'button.submit': 'Enviar',
    'button.cancel': 'Cancelar',
  },
  ar: {
    'app.title': 'ResqLink',
    'app.description': 'خدمات الطوارئ الطبية',
    'home.welcome': 'أهلا وسهلا بك في ResqLink',
    'button.submit': 'إرسال',
    'button.cancel': 'إلغاء',
  },
};

@Injectable()
export class LanguageService {
  constructor(private readonly prisma: PrismaService) {}

  getAvailableLanguages() {
    return {
      languages: LANGUAGES,
      count: LANGUAGES.length,
    };
  }

  getTranslations(code: string) {
    if (!TRANSLATIONS[code]) {
      throw new NotFoundException(`Language '${code}' not found`);
    }

    return {
      language: code,
      translations: TRANSLATIONS[code],
      count: Object.keys(TRANSLATIONS[code]).length,
    };
  }

  async getUserLanguagePreference(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, language: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      userId: user.id,
      language: user.language || 'en',
    };
  }

  async setUserLanguagePreference(userId: string, language: string) {
    // Validate language code
    const validLanguage = LANGUAGES.find((l) => l.code === language);
    if (!validLanguage) {
      throw new BadRequestException(
        `Invalid language code '${language}'. Supported languages: ${LANGUAGES.map((l) => l.code).join(', ')}`,
      );
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { language },
      select: { id: true, language: true },
    });

    return {
      message: 'Language preference updated',
      userId: updated.id,
      language: updated.language,
    };
  }
}
