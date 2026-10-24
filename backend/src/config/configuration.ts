export default () => ({
  environment: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '4000', 10),
  apiPrefix: process.env.API_PREFIX || 'api/v1',
  corsOrigin: process.env.CORS_ORIGIN || '*',
  publicAccessEnable: process.env.PUBLIC_ACCESS_ENABLE === 'true',
  auth: {
    jwtSecret: process.env.JWT_SECRET || 'super-secret-jwt-key-minimum-32-chars-long-secops',
    adminPassword: process.env.OPERATOR_ADMIN_PASSWORD || 'admin123!',
    serviceApiKey: process.env.SERVICE_API_KEY || 'secops-internal-service-key-production',
  },
  database: {
    uri: process.env.MONGODB_URI,
  },
  redis: {
    url: process.env.REDIS_URL,
  },
  aiPlatform: {
    url: process.env.AI_PLATFORM_URL || 'https://ai-platform.onrender.com',
    apiKey: process.env.AI_PLATFORM_API_KEY || '',
  },
  notificationService: {
    url: process.env.NOTIFICATION_SERVICE_URL || 'https://notification-service.onrender.com',
    apiKey: process.env.NOTIFICATION_SERVICE_API_KEY || '',
    alertEmailRecipient: process.env.ALERT_EMAIL_RECIPIENT || 'secops-alerts@company.internal',
  },
});
