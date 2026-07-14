import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { toPublicUser } from '../common/to-public-user';
import { PublicUser } from '../auth/auth.types';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

const SALT_ROUNDS = 12;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

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
    dto: UpdateUserDto,
  ): Promise<PublicUser> {
    await this.findOneInOrganization(id, organizationId);
    const user = await this.prisma.user.update({
      where: { id },
      data: dto,
    });
    return toPublicUser(user);
  }
}
