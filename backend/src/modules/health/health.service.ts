import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '../integrations/redis.service';

@Injectable()
export class HealthService {
  private readonly startTime = Date.now();

  constructor(
    private readonly configService: ConfigService,
    private readonly redisService: RedisService,
  ) {}

  async checkHealth() {
    const mongoUri = this.configService.get<string>('database.uri');
    const aiKey = this.configService.get<string>('aiPlatform.apiKey');
    const notifyKey = this.configService.get<string>(
      'notificationService.apiKey',
    );
    const publicAccess =
      this.configService.get<boolean>('publicAccessEnable') ?? false;

    const redisHealthy = await this.redisService.isHealthy();

    return {
      status: 'UP',
      application: 'AI Data Access & Policy Auditor',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor((Date.now() - this.startTime) / 1000),
      features: {
        publicAccessEnabled: publicAccess,
        deterministicAuthorizationEngine: 'ACTIVE',
        immutableTamperEvidentAuditChain: 'ACTIVE',
      },
      services: {
        api: 'UP',
        persistence: mongoUri ? 'MONGODB_CONNECTED' : 'IN_MEMORY_REPOSITORY',
        redis: redisHealthy ? 'UP' : 'DEGRADED_FALLBACK',
        aiPlatform:
          aiKey && aiKey.trim().length > 0
            ? 'INTEGRATED'
            : 'LOCAL_DETERMINISTIC_SYNTHESIS',
        notificationService:
          notifyKey && notifyKey.trim().length > 0
            ? 'INTEGRATED'
            : 'LOCAL_AUDIT_LOGGING',
      },
    };
  }
}
