import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AiPlatformAdapter } from './ai-platform.adapter';
import { NotificationAdapter } from './notification.adapter';
import { RedisService } from './redis.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [AiPlatformAdapter, NotificationAdapter, RedisService],
  exports: [AiPlatformAdapter, NotificationAdapter, RedisService],
})
export class IntegrationsModule {}
