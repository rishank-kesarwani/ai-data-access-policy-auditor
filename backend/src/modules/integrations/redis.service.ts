import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis | null = null;
  private readonly memoryCache = new Map<string, { value: string; expiry: number }>();

  constructor(private readonly configService: ConfigService) {
    const redisUrl = this.configService.get<string>('redis.url');

    if (redisUrl && redisUrl.trim().length > 0) {
      try {
        this.client = new Redis(redisUrl, {
          maxRetriesPerRequest: 1,
          connectTimeout: 4000,
          lazyConnect: true,
        });

        this.client.connect().catch((err) => {
          this.logger.warn(`Redis connection failed (${err.message}). Using in-memory cache.`);
          this.client = null;
        });

        this.client.on('error', (err) => {
          this.logger.warn(`Redis error: ${err.message}`);
        });

        this.logger.log(`Initialized Redis client with ${redisUrl.replace(/\/\/[^@]*@/, '//***@')}`);
      } catch (err: any) {
        this.logger.warn(`Failed to initialize Redis: ${err.message}. Using in-memory fallback.`);
        this.client = null;
      }
    } else {
      this.logger.log('Redis URL not configured. Operating with in-memory TTL cache.');
    }
  }

  async get(key: string): Promise<string | null> {
    if (this.client) {
      try {
        return await this.client.get(key);
      } catch {
        // Fall back to memory
      }
    }

    const item = this.memoryCache.get(key);
    if (!item) return null;
    if (Date.now() > item.expiry) {
      this.memoryCache.delete(key);
      return null;
    }
    return item.value;
  }

  async set(key: string, value: string, ttlSeconds: number = 300): Promise<void> {
    if (this.client) {
      try {
        await this.client.set(key, value, 'EX', ttlSeconds);
        return;
      } catch {
        // Fall back to memory
      }
    }

    this.memoryCache.set(key, {
      value,
      expiry: Date.now() + ttlSeconds * 1000,
    });
  }

  async isHealthy(): Promise<boolean> {
    if (!this.client) return true; // In-memory fallback is healthy
    try {
      const pong = await this.client.ping();
      return pong === 'PONG';
    } catch {
      return false;
    }
  }

  async onModuleDestroy() {
    if (this.client) {
      await this.client.quit().catch(() => {});
    }
  }
}
