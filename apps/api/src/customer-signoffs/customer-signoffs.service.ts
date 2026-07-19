import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditLogService } from '../audit/audit-log.service';
import { CreateCustomerSignoffDto } from './dto/create-customer-signoff.dto';
import { UpdateCustomerSignoffDto } from './dto/update-customer-signoff.dto';

@Injectable()
export class CustomerSignoffsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
  ) {}

  findAllInOrganization(organizationId: string, projectId?: string) {
    return this.prisma.customerSignoff.findMany({
      where: { organizationId, ...(projectId ? { projectId } : {}) },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOneInOrganization(id: string, organizationId: string) {
    const signoff = await this.prisma.customerSignoff.findFirst({
      where: { id, organizationId },
    });
    if (!signoff) {
      throw new NotFoundException('Customer sign-off not found.');
    }
    return signoff;
  }

  async create(
    organizationId: string,
    actorId: string,
    dto: CreateCustomerSignoffDto,
  ) {
    const project = await this.prisma.project.findFirst({
      where: { id: dto.projectId, organizationId },
    });
    if (!project) {
      throw new NotFoundException('Project not found.');
    }

    const signoff = await this.prisma.customerSignoff.create({
      data: {
        organizationId,
        projectId: dto.projectId,
        title: dto.title,
        customerName: dto.customerName,
        requestedById: actorId,
      },
    });
    await this.auditLog.record({
      organizationId,
      projectId: signoff.projectId,
      actorId,
      action: 'CUSTOMER_SIGNOFF_REQUESTED',
      metadata: { title: signoff.title, customerName: signoff.customerName },
    });
    return signoff;
  }

  async update(
    id: string,
    organizationId: string,
    actorId: string,
    dto: UpdateCustomerSignoffDto,
  ) {
    const existing = await this.findOneInOrganization(id, organizationId);

    const signoff = await this.prisma.customerSignoff.update({
      where: { id },
      data: dto,
    });

    if (dto.status && dto.status !== existing.status) {
      await this.auditLog.record({
        organizationId,
        projectId: signoff.projectId,
        actorId,
        action: 'CUSTOMER_SIGNOFF_STATUS_CHANGED',
        metadata: { from: existing.status, to: dto.status },
      });
    }

    return signoff;
  }
}
