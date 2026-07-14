import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';
import { Role } from '../../../generated/prisma/client';
import { AuthenticatedUser } from '../auth.types';

function makeContext(user?: AuthenticatedUser): ExecutionContext {
  return {
    getHandler: () => ({}),
    getClass: () => ({}),
    switchToHttp: () => ({
      getRequest: () => ({ user }),
    }),
  } as unknown as ExecutionContext;
}

describe('RolesGuard', () => {
  const adminUser: AuthenticatedUser = {
    userId: 'user-1',
    email: 'admin@acme.test',
    role: Role.ADMIN,
    organizationId: 'org-1',
  };
  const memberUser: AuthenticatedUser = {
    ...adminUser,
    userId: 'user-2',
    role: Role.MEMBER,
  };

  function guardWithRequiredRoles(roles: Role[] | undefined) {
    const reflector = { getAllAndOverride: jest.fn().mockReturnValue(roles) };
    return new RolesGuard(reflector as unknown as Reflector);
  }

  it('allows the request through when no roles are required', () => {
    const guard = guardWithRequiredRoles(undefined);
    expect(guard.canActivate(makeContext(memberUser))).toBe(true);
  });

  it('allows a user whose role is in the required list', () => {
    const guard = guardWithRequiredRoles([Role.ADMIN]);
    expect(guard.canActivate(makeContext(adminUser))).toBe(true);
  });

  it('rejects a user whose role is not in the required list', () => {
    const guard = guardWithRequiredRoles([Role.ADMIN]);
    expect(() => guard.canActivate(makeContext(memberUser))).toThrow(
      ForbiddenException,
    );
  });

  it('rejects when there is no authenticated user on the request', () => {
    const guard = guardWithRequiredRoles([Role.ADMIN]);
    expect(() => guard.canActivate(makeContext(undefined))).toThrow(
      ForbiddenException,
    );
  });
});
