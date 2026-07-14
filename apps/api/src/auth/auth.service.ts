import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '../../generated/prisma/client';
import { toPublicUser } from '../common/to-public-user';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthenticatedUser, JwtPayload, PublicUser } from './auth.types';

const SALT_ROUNDS = 12;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async register(
    dto: RegisterDto,
  ): Promise<{ accessToken: string; user: PublicUser }> {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) {
      throw new ConflictException('An account with this email already exists.');
    }

    const passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);

    const user = await this.prisma.$transaction(async (tx) => {
      const organization = await tx.organization.create({
        data: { name: dto.organizationName },
      });

      // First user of a newly created organization is its admin.
      return tx.user.create({
        data: {
          email: dto.email,
          name: dto.name,
          passwordHash,
          role: Role.ADMIN,
          organizationId: organization.id,
        },
      });
    });

    return { accessToken: this.issueToken(user), user: toPublicUser(user) };
  }

  async login(
    dto: LoginDto,
  ): Promise<{ accessToken: string; user: PublicUser }> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    const passwordMatches = await bcrypt.compare(
      dto.password,
      user.passwordHash,
    );
    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    return { accessToken: this.issueToken(user), user: toPublicUser(user) };
  }

  async me(authUser: AuthenticatedUser): Promise<PublicUser> {
    const user = await this.prisma.user.findUnique({
      where: { id: authUser.userId },
    });
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Account is no longer active.');
    }
    return toPublicUser(user);
  }

  private issueToken(user: {
    id: string;
    email: string;
    role: Role;
    organizationId: string;
  }): string {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      organizationId: user.organizationId,
    };
    return this.jwt.sign(payload);
  }
}
