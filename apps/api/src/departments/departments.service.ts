import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditLogService } from '../audit/audit-log.service';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';

@Injectable()
export class DepartmentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
  ) {}

  findAllInOrganization(organizationId: string) {
    return this.prisma.department.findMany({
      where: { organizationId },
      orderBy: { name: 'asc' },
    });
  }

  async findOneInOrganization(id: string, organizationId: string) {
    const department = await this.prisma.department.findFirst({
      where: { id, organizationId },
    });
    if (!department) {
      throw new NotFoundException('Department not found.');
    }
    return department;
  }

  private async assertParentInOrganization(
    parentId: string,
    organizationId: string,
  ) {
    const parent = await this.prisma.department.findFirst({
      where: { id: parentId, organizationId },
    });
    if (!parent) {
      throw new NotFoundException('Parent department not found.');
    }
  }

  private async assertNoCycle(id: string, proposedParentId: string) {
    let current: string | null = proposedParentId;
    while (current) {
      if (current === id) {
        throw new BadRequestException(
          'A department cannot be moved under its own descendant.',
        );
      }
      const parent: { parentId: string | null } | null =
        await this.prisma.department.findUnique({
          where: { id: current },
          select: { parentId: true },
        });
      current = parent?.parentId ?? null;
    }
  }

  async create(
    organizationId: string,
    actorId: string,
    dto: CreateDepartmentDto,
  ) {
    if (dto.parentId) {
      await this.assertParentInOrganization(dto.parentId, organizationId);
    }

    const department = await this.prisma.department.create({
      data: {
        organizationId,
        name: dto.name,
        parentId: dto.parentId,
      },
    });
    await this.auditLog.record({
      organizationId,
      actorId,
      action: 'DEPARTMENT_CREATED',
      metadata: { name: department.name },
    });
    return department;
  }

  async update(
    id: string,
    organizationId: string,
    actorId: string,
    dto: UpdateDepartmentDto,
  ) {
    const existing = await this.findOneInOrganization(id, organizationId);

    if (dto.parentId) {
      await this.assertParentInOrganization(dto.parentId, organizationId);
      await this.assertNoCycle(id, dto.parentId);
    }

    const department = await this.prisma.department.update({
      where: { id },
      data: dto,
    });

    if (dto.name && dto.name !== existing.name) {
      await this.auditLog.record({
        organizationId,
        actorId,
        action: 'DEPARTMENT_UPDATED',
        metadata: { from: existing.name, to: dto.name },
      });
    }

    return department;
  }
}
