import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { IS_PUBLIC_KEY, IS_PUBLIC_SIMULATOR_KEY, ROLES_KEY, UserRole } from '../constants';

@Injectable()
export class CombinedAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const isPublicSimulator = this.reflector.getAllAndOverride<boolean>(
      IS_PUBLIC_SIMULATOR_KEY,
      [context.getHandler(), context.getClass()],
    );

    const publicAccessEnabled =
      this.configService.get<boolean>('publicAccessEnable') ?? false;

    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;
    const apiKeyHeader = request.headers['x-service-api-key'];

    const configuredApiKey = this.configService.get<string>('auth.serviceApiKey');

    // 1. Check Service API Key header first
    if (apiKeyHeader && configuredApiKey && apiKeyHeader === configuredApiKey) {
      request.user = {
        userId: 'service-account',
        email: 'service-account@secops.internal',
        role: UserRole.ADMIN,
        isService: true,
      };
      return this.validateRoles(context, request.user);
    }

    // 2. Check JWT Bearer token
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      let decoded: any = null;
      try {
        decoded = this.jwtService.verify(token, {
          secret: this.configService.get<string>('auth.jwtSecret'),
        });
      } catch (err) {
        throw new UnauthorizedException('Invalid or expired authentication token');
      }

      request.user = decoded;
      return this.validateRoles(context, request.user);
    }

    // 3. If Public Access Flag is enabled AND the route is explicitly allowed for public access
    if (publicAccessEnabled && (isPublic || isPublicSimulator)) {
      request.user = {
        userId: 'anonymous-public-viewer',
        email: 'public-viewer@guest.local',
        role: UserRole.VIEWER,
        isAnonymous: true,
      };
      return true;
    }

    // 4. Otherwise, reject with appropriate status
    if (publicAccessEnabled && !isPublic && !isPublicSimulator) {
      throw new UnauthorizedException(
        'Authentication required. This administrative, audit, or policy mutation action is protected and unavailable to public viewers.',
      );
    }

    throw new UnauthorizedException(
      'Authentication required. Set PUBLIC_ACCESS_ENABLE=true to explore demo simulation, or provide a valid Bearer token / x-service-api-key.',
    );
  }

  private validateRoles(context: ExecutionContext, user: any): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    if (!user || !user.role) {
      throw new ForbiddenException('Insufficient security privileges');
    }

    // Admin has access to all roles
    if (user.role === UserRole.ADMIN) {
      return true;
    }

    const hasRole = requiredRoles.includes(user.role);
    if (!hasRole) {
      throw new ForbiddenException(
        `Forbidden: Role '${user.role}' lacks required permissions [${requiredRoles.join(', ')}]`,
      );
    }

    return true;
  }
}
