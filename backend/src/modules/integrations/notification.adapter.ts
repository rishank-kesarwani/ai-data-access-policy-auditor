import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class NotificationAdapter {
  private readonly logger = new Logger(NotificationAdapter.name);

  constructor(private readonly configService: ConfigService) {}

  /**
   * Dispatches an alert via Railway Notification Service upon human escalation or policy approval events.
   */
  async sendSecurityAlert(payload: {
    title: string;
    message: string;
    severity: 'CRITICAL' | 'BULK';
    category: 'POLICY_APPROVAL' | 'ACCESS_ESCALATION';
    details: Record<string, any>;
  }): Promise<boolean> {
    const serviceUrl = this.configService.get<string>('notificationService.url');
    const serviceKey = this.configService.get<string>('notificationService.apiKey');
    const recipientEmail = this.configService.get<string>(
      'notificationService.alertEmailRecipient',
    );

    if (serviceUrl && serviceKey && serviceKey.trim().length > 0) {
      try {
        this.logger.log(
          `Dispatching security notification to Railway Notification Service: ${serviceUrl}/v1/notifications`,
        );

        const notificationBody = {
          priority: payload.severity === 'CRITICAL' ? 'CRITICAL' : 'BULK',
          channels: ['EMAIL'],
          recipient: {
            userId: 'secops-oncall',
            email: recipientEmail,
          },
          email: {
            subject: `[${payload.severity}] ${payload.title}`,
            html: `
              <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px;">
                <h2 style="color: #0f172a; margin-top: 0;">${payload.title}</h2>
                <p style="color: #334155; font-size: 15px; line-height: 1.5;">${payload.message}</p>
                <div style="background-color: #f8fafc; padding: 16px; border-radius: 6px; font-family: monospace; font-size: 13px; margin: 16px 0;">
                  <pre style="margin: 0; white-space: pre-wrap;">${JSON.stringify(payload.details, null, 2)}</pre>
                </div>
                <p style="color: #64748b; font-size: 12px; margin-bottom: 0;">Dispatched automatically by AI Data Access & Policy Auditor</p>
              </div>
            `,
            text: `${payload.title}\n\n${payload.message}\n\nDetails:\n${JSON.stringify(payload.details, null, 2)}`,
          },
          metadata: {
            source: 'ai-data-access-policy-auditor',
            category: payload.category,
            timestamp: new Date().toISOString(),
          },
        };

        await axios.post(
          `${serviceUrl.replace(/\/+$/, '')}/v1/notifications`,
          notificationBody,
          {
            headers: {
              'x-api-key': serviceKey,
              'Content-Type': 'application/json',
            },
            timeout: 5000,
          },
        );

        this.logger.log(`Security alert successfully delivered to ${recipientEmail}`);
        return true;
      } catch (err: any) {
        this.logger.warn(
          `Failed to dispatch notification to Railway service: ${err.message}. Event logged locally.`,
        );
      }
    } else {
      this.logger.log(
        `[MOCK NOTIFICATION] Dispatched ${payload.severity} alert: "${payload.title}" -> ${payload.message}`,
      );
    }

    return false;
  }
}
