import { NotFoundException } from '@nestjs/common';
import { PluginsService } from './plugins.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditLogService } from '../audit/audit-log.service';

describe('PluginsService', () => {
  let service: PluginsService;
  let prisma: {
    pluginManifest: {
      findMany: jest.Mock;
      findFirst: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
    };
  };
  let auditLog: { record: jest.Mock };

  const orgId = 'org-1';
  const actorId = 'user-1';
  const plugin = {
    id: 'plugin-1',
    organizationId: orgId,
    name: 'jira-sync',
    version: '1.0.0',
    description: null,
    manifest: { hooks: ['onIssueCreated'] },
    isEnabled: true,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
  };

  beforeEach(() => {
    prisma = {
      pluginManifest: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
    };
    auditLog = { record: jest.fn() };
    service = new PluginsService(
      prisma as unknown as PrismaService,
      auditLog as unknown as AuditLogService,
    );
  });

  it('lists plugin manifests scoped to an organization', async () => {
    prisma.pluginManifest.findMany.mockResolvedValue([plugin]);

    const result = await service.findAllInOrganization(orgId);

    expect(prisma.pluginManifest.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { organizationId: orgId } }),
    );
    expect(result).toEqual([plugin]);
  });

  it('registers a plugin manifest and writes a PLUGIN_REGISTERED audit log entry', async () => {
    prisma.pluginManifest.create.mockResolvedValue(plugin);

    const result = await service.create(orgId, actorId, {
      name: plugin.name,
      version: plugin.version,
      manifest: plugin.manifest,
    });

    expect(auditLog.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'PLUGIN_REGISTERED' }),
    );
    expect(result).toEqual(plugin);
  });

  it('rejects updating a plugin manifest that is not in the caller organization', async () => {
    prisma.pluginManifest.findFirst.mockResolvedValue(null);

    await expect(
      service.update(plugin.id, orgId, actorId, { name: 'x' }),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.pluginManifest.update).not.toHaveBeenCalled();
  });

  it('writes a PLUGIN_TOGGLED audit log entry only when isEnabled actually changes', async () => {
    prisma.pluginManifest.findFirst.mockResolvedValue(plugin);
    prisma.pluginManifest.update.mockResolvedValue({
      ...plugin,
      isEnabled: false,
    });

    await service.update(plugin.id, orgId, actorId, { isEnabled: false });

    expect(auditLog.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'PLUGIN_TOGGLED' }),
    );
  });

  it('does not write a PLUGIN_TOGGLED entry for an unrelated field update', async () => {
    prisma.pluginManifest.findFirst.mockResolvedValue(plugin);
    prisma.pluginManifest.update.mockResolvedValue({
      ...plugin,
      description: 'updated',
    });

    await service.update(plugin.id, orgId, actorId, {
      description: 'updated',
    });

    expect(auditLog.record).not.toHaveBeenCalled();
  });
});
