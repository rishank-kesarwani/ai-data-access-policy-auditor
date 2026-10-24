import { ExecutionContext, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { CombinedAuthGuard } from './combined-auth.guard';
import { UserRole } from '../constants';

describe('CombinedAuthGuard (PUBLIC_ACCESS_ENABLE & Auth Verification)', () => {
  let guard: CombinedAuthGuard;
  let reflector: Reflector;
  let configService: ConfigService;
  let jwtService: JwtService;

  beforeEach(() => {
    reflector = new Reflector();
    configService = {
      get: jest.fn((key: string) => {
        if (key === 'publicAccessEnable') return false;
        if (key === 'auth.serviceApiKey') return 'test-service-key-123';
        if (key === 'auth.jwtSecret') return 'test-jwt-secret';
        return null;
      }),
    } as any;
    jwtService = {
      verify: jest.fn(),
    } as any;

    guard = new CombinedAuthGuard(reflector, configService, jwtService);
  });

  const createMockContext = (headers: Record<string, string> = {}) => {
    const request = { headers, user: null };
    return {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
      getHandler: () => ({}),
      getClass: () => ({}),
    } as unknown as ExecutionContext;
  };

  describe('When PUBLIC_ACCESS_ENABLE is false', () => {
    it('should reject unauthenticated request with UnauthorizedException even if route is public', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockImplementation((key) => {
        if (key === 'isPublic') return true;
        return undefined;
      });

      const context = createMockContext();
      expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
    });

    it('should allow valid x-service-api-key header and assign Admin role', () => {
      const context = createMockContext({
        'x-service-api-key': 'test-service-key-123',
      });

      const result = guard.canActivate(context);
      expect(result).toBe(true);
      expect(context.switchToHttp().getRequest().user.role).toBe(UserRole.ADMIN);
    });

    it('should allow valid JWT bearer token', () => {
      (jwtService.verify as jest.Mock).mockReturnValue({
        userId: 'usr-123',
        email: 'operator@secops.internal',
        role: UserRole.OPERATOR,
      });

      const context = createMockContext({
        authorization: 'Bearer valid-jwt-token',
      });

      const result = guard.canActivate(context);
      expect(result).toBe(true);
      expect(context.switchToHttp().getRequest().user.email).toBe('operator@secops.internal');
    });
  });

  describe('When PUBLIC_ACCESS_ENABLE is true', () => {
    beforeEach(() => {
      (configService.get as jest.Mock).mockImplementation((key: string) => {
        if (key === 'publicAccessEnable') return true;
        if (key === 'auth.serviceApiKey') return 'test-service-key-123';
        if (key === 'auth.jwtSecret') return 'test-jwt-secret';
        return null;
      });
    });

    it('should allow anonymous access to @Public() endpoints and tag user as anonymous viewer', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockImplementation((key) => {
        if (key === 'isPublic') return true;
        return undefined;
      });

      const context = createMockContext();
      const result = guard.canActivate(context);

      expect(result).toBe(true);
      const reqUser = context.switchToHttp().getRequest().user;
      expect(reqUser.isAnonymous).toBe(true);
      expect(reqUser.role).toBe(UserRole.VIEWER);
    });

    it('should REJECT anonymous access to non-public endpoints (e.g. audit, approvals, policy mutations)', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockImplementation(() => undefined);

      const context = createMockContext();
      expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
    });
  });

  describe('Role-based RBAC enforcement', () => {
    it('should reject users lacking required role with ForbiddenException', () => {
      (jwtService.verify as jest.Mock).mockReturnValue({
        userId: 'usr-viewer',
        email: 'viewer@guest.local',
        role: UserRole.VIEWER,
      });

      jest.spyOn(reflector, 'getAllAndOverride').mockImplementation((key) => {
        if (key === 'roles') return [UserRole.ADMIN, UserRole.OPERATOR];
        return undefined;
      });

      const context = createMockContext({
        authorization: 'Bearer valid-jwt-token',
      });

      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    });

    it('should allow ADMIN users to access any role-restricted endpoint', () => {
      (jwtService.verify as jest.Mock).mockReturnValue({
        userId: 'usr-admin',
        email: 'admin@secops.internal',
        role: UserRole.ADMIN,
      });

      jest.spyOn(reflector, 'getAllAndOverride').mockImplementation((key) => {
        if (key === 'roles') return [UserRole.AUDITOR];
        return undefined;
      });

      const context = createMockContext({
        authorization: 'Bearer valid-jwt-token',
      });

      expect(guard.canActivate(context)).toBe(true);
    });
  });
});
