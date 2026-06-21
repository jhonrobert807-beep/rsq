import { Injectable, Logger } from '@nestjs/common';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';

@Injectable()
export class AwsSnsService {
  private readonly logger = new Logger(AwsSnsService.name);
  private readonly client: SNSClient;
  private readonly enabled: boolean;

  constructor() {
    const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
    const region = process.env.AWS_REGION || 'ap-southeast-1';

    this.enabled = !!(accessKeyId && secretAccessKey);

    if (this.enabled) {
      this.client = new SNSClient({
        region,
        credentials: { accessKeyId: accessKeyId!, secretAccessKey: secretAccessKey! },
      });
      this.logger.log(`AWS SNS initialized (region: ${region})`);
    } else {
      this.logger.warn('AWS SNS not configured — AWS_ACCESS_KEY_ID or AWS_SECRET_ACCESS_KEY missing');
    }
  }

  async sendSms(phoneNumber: string, message: string): Promise<boolean> {
    if (!this.enabled) {
      this.logger.warn(`[AWS SNS] Not configured — skipping SMS to ${phoneNumber}`);
      return false;
    }

    const normalized = this.normalizePhone(phoneNumber);
    if (!normalized) {
      this.logger.warn(`[AWS SNS] Invalid phone number: ${phoneNumber}`);
      return false;
    }

    try {
      const command = new PublishCommand({
        PhoneNumber: normalized,
        Message: message,
        MessageAttributes: {
          'AWS.SNS.SMS.SenderID': {
            DataType: 'String',
            StringValue: 'ResqLink',
          },
          'AWS.SNS.SMS.SMSType': {
            DataType: 'String',
            StringValue: 'Transactional',
          },
        },
      });

      const result = await this.client.send(command);
      this.logger.log(`[AWS SNS] SMS sent to ${normalized} — MessageId: ${result.MessageId}`);
      return true;
    } catch (error) {
      this.logger.error(`[AWS SNS] Failed to send SMS to ${normalized}: ${error.message}`);
      return false;
    }
  }

  async sendOtp(phoneNumber: string, code: string): Promise<boolean> {
    const message = `Your ResqLink verification code is: ${code}. Valid for 10 minutes. Do not share this code.`;
    return this.sendSms(phoneNumber, message);
  }

  async sendNotification(phoneNumber: string, message: string): Promise<boolean> {
    return this.sendSms(phoneNumber, message);
  }

  private normalizePhone(phone: string): string | null {
    if (!phone || typeof phone !== 'string') return null;

    let cleaned = phone.replace(/\s+/g, '');

    // Already E.164
    if (cleaned.startsWith('+') && cleaned.length >= 10) return cleaned;

    // Remove leading +
    cleaned = cleaned.replace(/^\+/, '');

    // 03XX → +923XX
    if (cleaned.startsWith('0') && cleaned.length === 11) {
      return '+92' + cleaned.substring(1);
    }

    // 923XX → +923XX
    if (cleaned.startsWith('92') && cleaned.length === 12) {
      return '+' + cleaned;
    }

    // 3XX (10 digits, missing country code)
    if (cleaned.startsWith('3') && cleaned.length === 10) {
      return '+92' + cleaned;
    }

    return null;
  }
}
