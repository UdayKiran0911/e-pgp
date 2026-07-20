import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditLogService } from '../audit/audit-log.service';
import { CreatePluginManifestDto } from './dto/create-plugin-manifest.dto';
import { UpdatePluginManifestDto } from './dto/update-plugin-manifest.dto';
import type { Prisma } from '../../generated/prisma/client';

@Injectable()
export class PluginsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
  ) {}

  findAllInOrganization(organizationId: string) {
    return this.prisma.pluginManifest.findMany({
      where: { organizationId },
      orderBy: { name: 'asc' },
    });
  }

  async findOneInOrganization(id: string, organizationId: string) {
    const plugin = await this.prisma.pluginManifest.findFirst({
      where: { id, organizationId },
    });
    if (!plugin) {
      throw new NotFoundException('Plugin manifest not found.');
    }
    return plugin;
  }

  async create(
    organizationId: string,
    actorId: string,
    dto: CreatePluginManifestDto,
  ) {
    const plugin = await this.prisma.pluginManifest.create({
      data: {
        organizationId,
        name: dto.name,
        version: dto.version,
        description: dto.description,
        manifest: dto.manifest as Prisma.InputJsonValue,
      },
    });
    await this.auditLog.record({
      organizationId,
      actorId,
      action: 'PLUGIN_REGISTERED',
      metadata: { name: plugin.name, version: plugin.version },
    });
    return plugin;
  }

  async update(
    id: string,
    organizationId: string,
    actorId: string,
    dto: UpdatePluginManifestDto,
  ) {
    const existing = await this.findOneInOrganization(id, organizationId);

    const plugin = await this.prisma.pluginManifest.update({
      where: { id },
      data: {
        ...dto,
        manifest: dto.manifest as Prisma.InputJsonValue | undefined,
      },
    });

    if (dto.isEnabled !== undefined && dto.isEnabled !== existing.isEnabled) {
      await this.auditLog.record({
        organizationId,
        actorId,
        action: 'PLUGIN_TOGGLED',
        metadata: { name: existing.name, isEnabled: dto.isEnabled },
      });
    }

    return plugin;
  }
}
