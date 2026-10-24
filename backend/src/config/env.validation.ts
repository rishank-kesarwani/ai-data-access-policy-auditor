import { plainToInstance, Transform } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  MinLength,
  validateSync,
} from 'class-validator';

enum Environment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

export class EnvironmentVariables {
  @IsEnum(Environment)
  @IsOptional()
  NODE_ENV: Environment = Environment.Development;

  @IsNumber()
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  PORT: number = 4000;

  @IsString()
  @IsOptional()
  API_PREFIX: string = 'api/v1';

  @IsString()
  @IsOptional()
  CORS_ORIGIN: string = '*';

  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsOptional()
  PUBLIC_ACCESS_ENABLE: boolean = false;

  @IsString()
  @MinLength(16)
  @IsOptional()
  JWT_SECRET: string = 'super-secret-jwt-key-minimum-32-chars-long-secops';

  @IsString()
  @MinLength(6)
  @IsOptional()
  OPERATOR_ADMIN_PASSWORD: string = 'admin123!';

  @IsString()
  @IsOptional()
  SERVICE_API_KEY: string = 'secops-internal-service-key-production';

  @IsString()
  @IsOptional()
  MONGODB_URI?: string;

  @IsString()
  @IsOptional()
  REDIS_URL?: string;

  @IsString()
  @IsOptional()
  AI_PLATFORM_URL?: string = 'https://ai-platform.onrender.com';

  @IsString()
  @IsOptional()
  AI_PLATFORM_API_KEY?: string;

  @IsString()
  @IsOptional()
  NOTIFICATION_SERVICE_URL?: string = 'https://notification-service.onrender.com';

  @IsString()
  @IsOptional()
  NOTIFICATION_SERVICE_API_KEY?: string;

  @IsString()
  @IsOptional()
  ALERT_EMAIL_RECIPIENT?: string = 'secops-alerts@company.internal';
}

export function validate(config: Record<string, unknown>) {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });
  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    throw new Error(`Config validation error: ${errors.toString()}`);
  }
  return validatedConfig;
}
