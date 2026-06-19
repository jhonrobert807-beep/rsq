import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OAuth2Client, TokenPayload } from 'google-auth-library';

@Injectable()
export class GoogleStrategy {
  private client: OAuth2Client;

  constructor(private configService: ConfigService) {
    const clientId = this.configService.getOrThrow<string>('GOOGLE_CLIENT_ID');
    this.client = new OAuth2Client(clientId);
  }

  async verifyIdToken(idToken: string): Promise<TokenPayload | undefined> {
    try {
      const ticket = await this.client.verifyIdToken({
        idToken,
      });
      const payload = ticket.getPayload();
      if (!payload) {
        throw new Error('No payload returned from Google');
      }
      return payload;
    } catch (error) {
      throw new Error(`Failed to verify Google ID token: ${error.message}`);
    }
  }
}
