import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import axios, { AxiosError } from 'axios';

interface SendPkResponse {
  success?: boolean;
  message?: string;
  error?: string;
  status?: string;
}

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);
  private readonly apiKey = process.env.SENDPK_API_KEY;
  private readonly sender = process.env.SENDPK_SENDER_ID || 'ResqLink';
  private readonly apiUrl = 'https://sendpk.com/api/sms.php';
  private readonly whatsappApiUrl = 'http://wa.sendpk.com/api/send.php';
  private readonly whatsappId = process.env.SENDPK_WHATSAPP_ID || '150';
  private readonly whatsappOtpTemplateId = process.env.SENDPK_OTP_TEMPLATE_ID || '349';

  async sendOtp(phoneNumber: string, code: string, name?: string): Promise<void> {
    const customerName = name || 'Customer';
    // Try WhatsApp first, fall back to SMS
    const whatsappSent = await this.sendWhatsAppOtp(phoneNumber, customerName, code);
    if (!whatsappSent) {
      const message = `Your ResqLink OTP code is: ${code}. Valid for 10 minutes.`;
      await this.send(phoneNumber, message);
    }
  }

  async sendWhatsAppOtp(phoneNumber: string, name: string, code: string): Promise<boolean> {
    try {
      const normalizedPhone = this.normalizePhoneNumber(phoneNumber);
      if (!normalizedPhone) {
        this.logger.warn(`Invalid phone number for WhatsApp OTP: ${phoneNumber}`);
        return false;
      }

      const templateData = JSON.stringify([
        {
          mobile: normalizedPhone,
          body: [
            { type: 'text', text: name },
            { type: 'text', text: code },
          ],
        },
      ]);

      const response = await axios.get<SendPkResponse>(this.whatsappApiUrl, {
        params: {
          api_key: this.apiKey,
          whatsapp_id: this.whatsappId,
          template_id: this.whatsappOtpTemplateId,
          template_data: templateData,
        },
        timeout: 10000,
      });

      if (response.data.success || response.data.status === 'success') {
        this.logger.log(`WhatsApp OTP sent successfully to ${normalizedPhone}`);
        return true;
      }

      const errorMsg = response.data.error || response.data.message || 'Unknown error';
      this.logger.warn(`WhatsApp OTP failed: ${errorMsg}, falling back to SMS`);
      return false;
    } catch (error) {
      this.logger.warn(`WhatsApp OTP request failed, falling back to SMS: ${error}`);
      return false;
    }
  }

  async sendVerification(phoneNumber: string, message: string): Promise<void> {
    await this.send(phoneNumber, message);
  }

  async sendNotification(phoneNumber: string, message: string): Promise<void> {
    await this.send(phoneNumber, message);
  }

  /**
   * Send SMS via SendPK API
   * Normalizes phone number to 92XXX format
   * Logs all attempts for debugging
   */
  private async send(phoneNumber: string, message: string): Promise<void> {
    try {
      // Validate and normalize phone number
      const normalizedPhone = this.normalizePhoneNumber(phoneNumber);
      if (!normalizedPhone) {
        throw new BadRequestException('Invalid phone number format');
      }

      // Trim message to avoid length issues
      if (message.length > 160) {
        this.logger.warn(
          `SMS message length ${message.length} exceeds 160 chars, will be truncated`,
        );
      }

      this.logger.debug(`Sending SMS to ${normalizedPhone}`);

      const response = await axios.get<SendPkResponse>(this.apiUrl, {
        params: {
          api_key: this.apiKey,
          sender: this.sender,
          mobile: normalizedPhone,
          message: message,
        },
        timeout: 10000,
      });

      // Check response status
      if (response.data.success || response.data.message?.includes('success')) {
        this.logger.log(`SMS sent successfully to ${normalizedPhone}`);
        return;
      }

      // Log API errors
      const errorMsg = response.data.error || response.data.message || 'Unknown error';
      this.logger.error(`SendPK API error: ${errorMsg}`);

      // Handle specific SendPK error codes
      if (errorMsg.includes('IP') || errorMsg.includes('Whitelist')) {
        this.logger.error(
          `SendPK API IP not whitelisted. Please whitelist your IP at https://sendpk.com/dashboard/profile.php`,
        );
        // Don't throw - allow graceful degradation
        return;
      }

      if (errorMsg.includes('balance') || errorMsg.includes('credit')) {
        this.logger.error('SendPK account has insufficient balance');
        // Don't throw - allow graceful degradation
        return;
      }

      this.logger.warn(`SMS delivery may have failed: ${errorMsg}`);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;
        this.logger.error(
          `SendPK API request failed: ${axiosError.message}`,
          axiosError.response?.data,
        );
      } else if (error instanceof BadRequestException) {
        throw error;
      } else {
        this.logger.error(`Unexpected error sending SMS: ${error}`);
      }

      // Graceful degradation: log but don't throw
      // OTP system should still work via email if SMS fails
    }
  }

  /**
   * Normalize phone number to 92XXX format (Pakistan)
   * Accepts: 923XXX..., +923XXX..., 03XXX...
   * Returns: 92XXX... or null if invalid
   */
  private normalizePhoneNumber(phone: string): string | null {
    if (!phone || typeof phone !== 'string') {
      return null;
    }

    // Remove all non-digit characters except leading +
    let cleaned = phone.replace(/[^\d+]/g, '').replace(/^(\+)?/, '');

    // Remove leading + if present
    if (phone.startsWith('+')) {
      cleaned = phone.substring(1).replace(/\D/g, '');
    }

    // Check if starts with 0 (local format: 03XX)
    if (cleaned.startsWith('0')) {
      cleaned = '92' + cleaned.substring(1);
    }

    // Check if starts with 92 (already in correct format)
    if (cleaned.startsWith('92')) {
      // Validate length (92 + 10 digits = 12 total)
      if (cleaned.length === 12 && /^\d+$/.test(cleaned)) {
        return cleaned;
      }
    }

    // Check if starts with 3 (missing country code: 3XX...)
    if (cleaned.startsWith('3') && !cleaned.startsWith('92')) {
      cleaned = '92' + cleaned;
      if (cleaned.length === 12 && /^\d+$/.test(cleaned)) {
        return cleaned;
      }
    }

    return null;
  }
}
