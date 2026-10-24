import { SetMetadata, createParamDecorator, ExecutionContext } from '@nestjs/common';
import {
  IS_PUBLIC_KEY,
  IS_PUBLIC_SIMULATOR_KEY,
  ROLES_KEY,
  UserRole,
} from '../constants';

export { IS_PUBLIC_SIMULATOR_KEY };

/**
 * Marks an endpoint as accessible to unauthenticated visitors when PUBLIC_ACCESS_ENABLE is true.
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

/**
 * Explicitly marks a simulator or demo endpoint accessible for public simulation.
 */
export const PublicSimulator = () => SetMetadata(IS_PUBLIC_SIMULATOR_KEY, true);

/**
 * Restricts an endpoint to users with specific roles.
 */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);

/**
 * Parameter decorator to extract authenticated user identity from request.
 */
export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
