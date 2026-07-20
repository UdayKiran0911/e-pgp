import { NotFoundException } from '@nestjs/common';
import { RequirementsService } from './requirements.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditLogService } from '../audit/audit-log.service';
import { RequirementStatus } from '../../generated/prisma/client';

describe('RequirementsService', () => {
  let service: RequirementsService;
  let prisma: {
    project: { findFirst: jest.Mock };
    requirement: {
      findMany: jest.Mock;
      findFirst: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
    };
  };
  let auditLog: { record: jest.Mock };

  const orgId = 'org-1';
  const actorId = 'user-1';
  const project = { id: 'project-1', organizationId: orgId };
  const requirement = {
    id: 'req-1',
    organizationId: orgId,
    projectId: project.id,
    title: 'Support SSO login',
    description: null,
    status: RequirementStatus.DRAFT,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
  };

  beforeEach(() => {
    prisma = {
      project: { findFirst: jest.fn() },
      requirement: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
    };
    auditLog = { record: jest.fn() };
    service = new RequirementsService(
      prisma as unknown as PrismaService,
      auditLog as unknown as AuditLogService,
    );
  });

  it('lists requirements scoped to an organization, optionally filtered by project', async () => {
    prisma.requirement.findMany.mockResolvedValue([requirement]);

    const result = await service.findAllInOrganization(orgId, project.id);

    expect(prisma.requirement.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { organizationId: orgId, projectId: project.id },
      }),
    );
    expect(result).toEqual([requirement]);
  });

  it('rejects creating a requirement against a project outside the caller organization', async () => {
    prisma.project.findFirst.mockResolvedValue(null);

    await expect(
      service.create(orgId, actorId, {
        projectId: project.id,
        title: requirement.title,
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.requirement.create).not.toHaveBeenCalled();
  });

  it('creates a requirement and writes a REQUIREMENT_CREATED audit log entry', async () => {
    prisma.project.findFirst.mockResolvedValue(project);
    prisma.requirement.create.mockResolvedValue(requirement);

    const result = await service.create(orgId, actorId, {
      projectId: project.id,
      title: requirement.title,
    });

    expect(auditLog.record).toHaveBeenCalledWith(
      expect.objectContaining({
        organizationId: orgId,
        projectId: project.id,
        actorId,
        action: 'REQUIREMENT_CREATED',
      }),
    );
    expect(result).toEqual(requirement);
  });

  it('updates the status and writes a REQUIREMENT_STATUS_CHANGED audit log entry', async () => {
    prisma.requirement.findFirst.mockResolvedValue(requirement);
    prisma.requirement.update.mockResolvedValue({
      ...requirement,
      status: RequirementStatus.APPROVED,
    });

    const result = await service.update(requirement.id, orgId, actorId, {
      status: RequirementStatus.APPROVED,
    });

    expect(auditLog.record).toHaveBeenCalledWith(
      expect.objectContaining({
        organizationId: orgId,
        projectId: requirement.projectId,
        actorId,
        action: 'REQUIREMENT_STATUS_CHANGED',
        metadata: {
          from: RequirementStatus.DRAFT,
          to: RequirementStatus.APPROVED,
        },
      }),
    );
    expect(result.status).toBe(RequirementStatus.APPROVED);
  });

  it('rejects updating a requirement that is not in the caller organization', async () => {
    prisma.requirement.findFirst.mockResolvedValue(null);

    await expect(
      service.update(requirement.id, 'org-2', actorId, { title: 'X' }),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.requirement.update).not.toHaveBeenCalled();
  });

  describe('analyze', () => {
    it('flags a requirement with no description and a too-short title', async () => {
      prisma.requirement.findMany.mockResolvedValue([
        { ...requirement, title: 'Login', description: null },
      ]);

      const [result] = await service.analyze(orgId, project.id);

      expect(result.flags).toEqual(
        expect.arrayContaining(['MISSING_DESCRIPTION', 'TITLE_TOO_SHORT']),
      );
    });

    it('does not flag a complete, recently-created requirement', async () => {
      prisma.requirement.findMany.mockResolvedValue([
        {
          ...requirement,
          title: 'Support single sign-on via SAML',
          description: 'Users must be able to log in via the corporate IdP.',
          createdAt: new Date(),
        },
      ]);

      const [result] = await service.analyze(orgId, project.id);

      expect(result.flags).toEqual([]);
    });

    it('flags requirements that share a title within the same project', async () => {
      prisma.requirement.findMany.mockResolvedValue([
        { ...requirement, id: 'req-1', title: 'Support SSO login' },
        { ...requirement, id: 'req-2', title: 'support sso login  ' },
      ]);

      const results = await service.analyze(orgId, project.id);

      expect(results.every((r) => r.flags.includes('DUPLICATE_TITLE'))).toBe(
        true,
      );
    });

    it('flags a DRAFT requirement older than the staleness threshold', async () => {
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 45);
      prisma.requirement.findMany.mockResolvedValue([
        {
          ...requirement,
          title: 'Support single sign-on via SAML',
          description: 'Users must be able to log in via the corporate IdP.',
          status: RequirementStatus.DRAFT,
          createdAt: oldDate,
        },
      ]);

      const [result] = await service.analyze(orgId, project.id);

      expect(result.flags).toContain('STALE_DRAFT');
    });

    it('does not flag an APPROVED requirement as stale regardless of age', async () => {
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 45);
      prisma.requirement.findMany.mockResolvedValue([
        {
          ...requirement,
          title: 'Support single sign-on via SAML',
          description: 'Users must be able to log in via the corporate IdP.',
          status: RequirementStatus.APPROVED,
          createdAt: oldDate,
        },
      ]);

      const [result] = await service.analyze(orgId, project.id);

      expect(result.flags).not.toContain('STALE_DRAFT');
    });
  });
});
