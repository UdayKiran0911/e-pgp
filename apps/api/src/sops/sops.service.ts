import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditLogService } from '../audit/audit-log.service';
import { CreateSopDto } from './dto/create-sop.dto';
import { UpdateSopDto } from './dto/update-sop.dto';

@Injectable()
export class SopsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
  ) {}

  findAllInOrganization(organizationId: string, category?: string) {
    return this.prisma.sop.findMany({
      where: { organizationId, ...(category ? { category } : {}) },
      orderBy: { title: 'asc' },
    });
  }

  async findOneInOrganization(id: string, organizationId: string) {
    const sop = await this.prisma.sop.findFirst({
      where: { id, organizationId },
    });
    if (!sop) {
      throw new NotFoundException('SOP not found.');
    }
    return sop;
  }

  async create(organizationId: string, actorId: string, dto: CreateSopDto) {
    const sop = await this.prisma.sop.create({
      data: {
        organizationId,
        title: dto.title,
        category: dto.category,
        content: dto.content,
      },
    });
    await this.auditLog.record({
      organizationId,
      actorId,
      action: 'SOP_CREATED',
      metadata: { title: sop.title, category: sop.category },
    });
    return sop;
  }

  async update(
    id: string,
    organizationId: string,
    actorId: string,
    dto: UpdateSopDto,
  ) {
    const existing = await this.findOneInOrganization(id, organizationId);

    const sop = await this.prisma.sop.update({
      where: { id },
      data: dto,
    });

    await this.auditLog.record({
      organizationId,
      actorId,
      action: 'SOP_UPDATED',
      metadata: { title: existing.title },
    });

    return sop;
  }
}
