import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '../../generated/prisma/client';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: {
    user: { findUnique: jest.Mock; create: jest.Mock };
    organization: { create: jest.Mock };
    $transaction: jest.Mock;
  };
  let jwt: { sign: jest.Mock };

  const baseUser = {
    id: 'user-1',
    email: 'admin@acme.test',
    name: 'Ada Min',
    role: Role.ADMIN,
    organizationId: 'org-1',
    isActive: true,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
  };

  beforeEach(() => {
    prisma = {
      user: { findUnique: jest.fn(), create: jest.fn() },
      organization: { create: jest.fn() },
      $transaction: jest.fn(),
    };
    jwt = { sign: jest.fn().mockReturnValue('signed.jwt.token') };

    service = new AuthService(
      prisma as unknown as PrismaService,
      jwt as unknown as JwtService,
    );
  });

  describe('register', () => {
    it('creates a new organization and an ADMIN user, returning a token', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.$transaction.mockImplementation((cb: (tx: unknown) => unknown) =>
        cb({
          organization: {
            create: jest.fn().mockResolvedValue({ id: 'org-1' }),
          },
          user: {
            create: jest.fn().mockResolvedValue({
              ...baseUser,
              passwordHash: 'hashed',
            }),
          },
        }),
      );

      const result = await service.register({
        organizationName: 'Acme Corp',
        name: 'Ada Min',
        email: 'admin@acme.test',
        password: 'super-secret-1',
      });

      expect(result.accessToken).toBe('signed.jwt.token');
      expect(result.user.email).toBe('admin@acme.test');
      expect(result.user).not.toHaveProperty('passwordHash');
      expect(jwt.sign).toHaveBeenCalledWith(
        expect.objectContaining({ sub: 'user-1', role: Role.ADMIN }),
      );
    });

    it('rejects registration when the email is already taken', async () => {
      prisma.user.findUnique.mockResolvedValue(baseUser);

      await expect(
        service.register({
          organizationName: 'Acme Corp',
          name: 'Ada Min',
          email: 'admin@acme.test',
          password: 'super-secret-1',
        }),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('login', () => {
    it('returns a token when credentials are valid', async () => {
      const passwordHash = await bcrypt.hash('correct-password', 4);
      prisma.user.findUnique.mockResolvedValue({ ...baseUser, passwordHash });

      const result = await service.login({
        email: baseUser.email,
        password: 'correct-password',
      });

      expect(result.accessToken).toBe('signed.jwt.token');
    });

    it('rejects an unknown email', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.login({ email: 'nobody@acme.test', password: 'whatever1' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('rejects a deactivated user even with the correct password', async () => {
      const passwordHash = await bcrypt.hash('correct-password', 4);
      prisma.user.findUnique.mockResolvedValue({
        ...baseUser,
        isActive: false,
        passwordHash,
      });

      await expect(
        service.login({ email: baseUser.email, password: 'correct-password' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('rejects the wrong password', async () => {
      const passwordHash = await bcrypt.hash('correct-password', 4);
      prisma.user.findUnique.mockResolvedValue({ ...baseUser, passwordHash });

      await expect(
        service.login({ email: baseUser.email, password: 'wrong-password' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });
  });

  describe('me', () => {
    it('returns the current user profile without the password hash', async () => {
      prisma.user.findUnique.mockResolvedValue({
        ...baseUser,
        passwordHash: 'hashed',
      });

      const result = await service.me({
        userId: baseUser.id,
        email: baseUser.email,
        role: baseUser.role,
        organizationId: baseUser.organizationId,
      });

      expect(result.id).toBe(baseUser.id);
      expect(result).not.toHaveProperty('passwordHash');
    });

    it('rejects when the account has since been deactivated', async () => {
      prisma.user.findUnique.mockResolvedValue({
        ...baseUser,
        isActive: false,
      });

      await expect(
        service.me({
          userId: baseUser.id,
          email: baseUser.email,
          role: baseUser.role,
          organizationId: baseUser.organizationId,
        }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });
  });
});
