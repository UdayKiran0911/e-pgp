import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { AuditLogService } from '../audit/audit-log.service';
import { toPublicUser } from '../common/to-public-user';
import { PublicUser } from '../auth/auth.types';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

const SALT_ROUNDS = 12;

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
  ) {}

  async findAllInOrganization(organizationId: string): Promise<PublicUser[]> {
    const users = await this.prisma.user.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'asc' },
    });
    return users.map(toPublicUser);
  }

  async findOneInOrganization(
    id: string,
    organizationId: string,
  ): Promise<PublicUser> {
    const user = await this.prisma.user.findFirst({
      where: { id, organizationId },
    });
    if (!user) {
      throw new NotFoundException('User not found.');
    }
    return toPublicUser(user);
  }

  async create(
    organizationId: string,
    dto: CreateUserDto,
  ): Promise<PublicUser> {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) {
      throw new ConflictException('An account with this email already exists.');
    }

    const passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        name: dto.name,
        passwordHash,
        role: dto.role,
        organizationId,
      },
    });
    return toPublicUser(user);
  }

  async update(
    id: string,
    organizationId: string,
    actorId: string,
    dto: UpdateUserDto,
  ): Promise<PublicUser> {
    const existing = await this.findOneInOrganization(id, organizationId);

    const user = await this.prisma.user.update({
      where: { id },
      data: dto,
    });

    if (dto.role !== undefined && dto.role !== existing.role) {
      await this.auditLog.record({
        organizationId,
        actorId,
        action: 'USER_ROLE_CHANGED',
        metadata: { userId: id, from: existing.role, to: dto.role },
      });
    }

    if (dto.isActive !== undefined && dto.isActive !== existing.isActive) {
      await this.auditLog.record({
        organizationId,
        actorId,
        action: dto.isActive ? 'USER_REACTIVATED' : 'USER_DEACTIVATED',
        metadata: { userId: id },
      });
    }

    return toPublicUser(user);
  }
}
