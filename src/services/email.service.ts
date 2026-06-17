import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class EmailService {
  private brevoApiKey: string;
  private brevoSenderEmail: string;
  private brevoSenderName: string;

  constructor(private configService: ConfigService) {
    this.brevoApiKey = this.configService.get<string>('BREVO_API_KEY') || '';
    this.brevoSenderEmail = this.configService.get<string>('BREVO_SENDER_EMAIL') || 'noreply@resqlink.com';
    this.brevoSenderName = this.configService.get<string>('BREVO_SENDER_NAME') || 'ResqLink';

    if (!this.brevoApiKey) {
      throw new Error('BREVO_API_KEY is not configured in environment variables');
    }
  }

  async sendOtpEmail(email: string, code: string): Promise<void> {
    try {
      const response = await axios.post(
        'https://api.brevo.com/v3/smtp/email',
        {
          sender: {
            name: this.brevoSenderName,
            email: this.brevoSenderEmail,
          },
          to: [
            {
              email: email,
              name: 'User',
            },
          ],
          subject: 'ResqLink - Your Verification Code',
          htmlContent: this.getOtpEmailTemplate(code),
        },
        {
          headers: {
            'api-key': this.brevoApiKey,
            'Content-Type': 'application/json',
          },
        },
      );

      if (response.status !== 201) {
        throw new BadRequestException('Failed to send OTP email');
      }
    } catch (error) {
      console.error('Brevo email error:', error.message);
      console.error('Brevo response:', error.response?.status, error.response?.data);
      throw new BadRequestException('Failed to send OTP email. Please try again.');
    }
  }

  private getOtpEmailTemplate(code: string): string {
    return `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>ResqLink - Verification Code</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; background-color: white; padding: 40px 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .logo { font-size: 28px; font-weight: bold; color: #007bff; }
            .content { text-align: center; }
            .title { font-size: 24px; color: #333; margin-bottom: 15px; }
            .description { font-size: 16px; color: #666; margin-bottom: 25px; }
            .otp-box {
              background: linear-gradient(135deg, #007bff 0%, #0056b3 100%);
              padding: 30px;
              border-radius: 10px;
              margin: 25px 0;
            }
            .otp-code {
              font-size: 42px;
              font-weight: bold;
              color: white;
              letter-spacing: 8px;
              margin: 0;
              font-family: 'Courier New', monospace;
            }
            .expiry { font-size: 14px; color: #666; margin-top: 20px; }
            .warning {
              background-color: #fff3cd;
              border-left: 4px solid #ffc107;
              padding: 15px;
              margin: 20px 0;
              border-radius: 4px;
              font-size: 14px;
              color: #856404;
            }
            .footer {
              text-align: center;
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #ddd;
              font-size: 12px;
              color: #999;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">🚑 ResqLink</div>
            </div>

            <div class="content">
              <h1 class="title">Email Verification</h1>
              <p class="description">Your one-time verification code is below:</p>

              <div class="otp-box">
                <p class="otp-code">${code}</p>
              </div>

              <p class="expiry">⏱️ This code expires in <strong>10 minutes</strong></p>

              <div class="warning">
                🔒 Never share this code with anyone. ResqLink support will never ask for it.
              </div>
            </div>

            <div class="footer">
              <p>© 2026 ResqLink. All rights reserved.</p>
              <p>This is an automated message. Please do not reply to this email.</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }
}
