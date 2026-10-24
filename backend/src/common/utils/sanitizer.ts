const SENSITIVE_KEY_PATTERNS = [
  /password/i,
  /secret/i,
  /token/i,
  /apiKey/i,
  /api_key/i,
  /authorization/i,
  /auth_header/i,
  /creditCard/i,
  /ssn/i,
  /privateKey/i,
  /cookie/i,
];

export class SanitizerUtil {
  /**
   * Deeply traverses an object or array and masks sensitive fields.
   */
  static redactSensitiveData(data: any): any {
    if (data === null || data === undefined) {
      return data;
    }

    if (typeof data === 'string') {
      // Check for Bearer token patterns
      if (data.toLowerCase().startsWith('bearer ')) {
        return 'Bearer [REDACTED]';
      }
      return data;
    }

    if (Array.isArray(data)) {
      return data.map((item) => this.redactSensitiveData(item));
    }

    if (typeof data === 'object') {
      const redacted: Record<string, any> = {};
      for (const [key, value] of Object.entries(data)) {
        const isSensitive = SENSITIVE_KEY_PATTERNS.some((pattern) => pattern.test(key));
        if (isSensitive) {
          redacted[key] = '[REDACTED]';
        } else if (typeof value === 'object' && value !== null) {
          redacted[key] = this.redactSensitiveData(value);
        } else {
          redacted[key] = value;
        }
      }
      return redacted;
    }

    return data;
  }
}
