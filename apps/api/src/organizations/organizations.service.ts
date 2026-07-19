import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditLogService } from '../audit/audit-log.service';
import { UpdateOrganizationDto } from './dto/update-organization.dto';

@Injectable()
export class OrganizationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
  ) {}

  async findOne(id: string) {
    const organization = await this.prisma.organization.findUnique({
      where: { id },
    });
    if (!organization) {
      throw new NotFoundException('Organization not found.');
    }
    return organization;
  }

  async update(id: string, actorId: string, dto: UpdateOrganizationDto) {
    const existing = await this.findOne(id);

    const organization = await this.prisma.organization.update({
      where: { id },
      data: { name: dto.name },
    });

    if (dto.name !== existing.name) {
      await this.auditLog.record({
        organizationId: id,
        actorId,
        action: 'ORGANIZATION_UPDATED',
        metadata: { from: existing.name, to: dto.name },
      });
    }

    return organization;
  }
}
