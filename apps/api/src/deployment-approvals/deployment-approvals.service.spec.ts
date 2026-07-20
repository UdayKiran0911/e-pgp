import { BadRequestException, NotFoundException } from '@nestjs/common';
import { DeploymentApprovalsService } from './deployment-approvals.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditLogService } from '../audit/audit-log.service';
import { NotificationsService } from '../notifications/notifications.service';
import { WebhookConnectorsService } from '../webhook-connectors/webhook-connectors.service';
import { EmailService } from '../email/email.service';
import { DeploymentStatus } from '../../generated/prisma/client';

interface NotifyCallArgs {
  organizationId: string;
  recipientId: string;
  title: string;
  body?: string;
  projectId?: string;
}

describe('DeploymentApprovalsService', () => {
  let service: DeploymentApprovalsService;
  let prisma: {
    project: { findFirst: jest.Mock };
    deploymentApproval: {
      findMany: jest.Mock;
      findFirst: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
    };
    governanceGate: { count: jest.Mock };
    customerSignoff: { count: jest.Mock };
    user: { findUnique: jest.Mock };
  };
  let auditLog: { record: jest.Mock };
  let notifications: { notify: jest.Mock<unknown, [NotifyCallArgs]> };
  let webhooks: { notify: jest.Mock<unknown, [string, string]> };
  let email: { send: jest.Mock };

  const orgId = 'org-1';
  const actorId = 'user-1';
  const requesterId = 'user-2';
  const project = { id: 'project-1', organizationId: orgId };
  const approval = {
    id: 'deploy-1',
    organizationId: orgId,
    projectId: project.id,
    title: 'Ship v2.0',
    status: DeploymentStatus.REQUESTED,
    requestedById: requesterId,
    notes: null,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
  };

  beforeEach(() => {
    prisma = {
      project: { findFirst: jest.fn() },
      deploymentApproval: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      governanceGate: { count: jest.fn() },
      customerSignoff: { count: jest.fn() },
      user: {
        findUnique: jest
          .fn()
          .mockResolvedValue({ email: 'requester@acme.test' }),
      },
    };
    auditLog = { record: jest.fn() };
    notifications = { notify: jest.fn<unknown, [NotifyCallArgs]>() };
    webhooks = { notify: jest.fn<unknown, [string, string]>() };
    email = { send: jest.fn() };
    service = new DeploymentApprovalsService(
      prisma as unknown as PrismaService,
      auditLog as unknown as AuditLogService,
      notifications as unknown as NotificationsService,
      webhooks as unknown as WebhookConnectorsService,
      email as unknown as EmailService,
    );
  });

  it('rejects requesting a deployment approval against a project outside the caller organization', async () => {
    prisma.project.findFirst.mockResolvedValue(null);

    await expect(
      service.create(orgId, actorId, {
        projectId: project.id,
        title: approval.title,
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.deploymentApproval.create).not.toHaveBeenCalled();
  });

  it('requests a deployment approval and writes a DEPLOYMENT_APPROVAL_REQUESTED audit log entry', async () => {
    prisma.project.findFirst.mockResolvedValue(project);
    prisma.deploymentApproval.create.mockResolvedValue(approval);

    const result = await service.create(orgId, actorId, {
      projectId: project.id,
      title: approval.title,
    });

    expect(auditLog.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'DEPLOYMENT_APPROVAL_REQUESTED' }),
    );
    expect(result).toEqual(approval);
  });

  it('rejects an invalid status transition', async () => {
    prisma.deploymentApproval.findFirst.mockResolvedValue({
      ...approval,
      status: DeploymentStatus.APPROVED,
    });

    await expect(
      service.update(approval.id, orgId, actorId, {
        status: DeploymentStatus.REQUESTED,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.deploymentApproval.update).not.toHaveBeenCalled();
  });

  it('blocks approval when governance gates are unmet or sign-offs are not received', async () => {
    prisma.deploymentApproval.findFirst.mockResolvedValue(approval);
    prisma.governanceGate.count.mockResolvedValue(2);
    prisma.customerSignoff.count.mockResolvedValue(1);

    await expect(
      service.update(approval.id, orgId, actorId, {
        status: DeploymentStatus.APPROVED,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.deploymentApproval.update).not.toHaveBeenCalled();
    expect(notifications.notify).not.toHaveBeenCalled();
    expect(webhooks.notify).not.toHaveBeenCalled();
  });

  it('approves once every gate is met and every sign-off is received, and notifies the requester', async () => {
    prisma.deploymentApproval.findFirst.mockResolvedValue(approval);
    prisma.governanceGate.count.mockResolvedValue(0);
    prisma.customerSignoff.count.mockResolvedValue(0);
    prisma.deploymentApproval.update.mockResolvedValue({
      ...approval,
      status: DeploymentStatus.APPROVED,
    });

    const result = await service.update(approval.id, orgId, actorId, {
      status: DeploymentStatus.APPROVED,
    });

    expect(result.status).toBe(DeploymentStatus.APPROVED);
    expect(auditLog.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'DEPLOYMENT_APPROVAL_STATUS_CHANGED',
        metadata: {
          from: DeploymentStatus.REQUESTED,
          to: DeploymentStatus.APPROVED,
        },
      }),
    );
    expect(notifications.notify).toHaveBeenCalledWith(
      expect.objectContaining({ recipientId: requesterId }),
    );
    expect(notifications.notify.mock.calls[0][0].title).toContain('approved');
    expect(webhooks.notify).toHaveBeenCalledWith(
      orgId,
      expect.stringContaining('approved'),
    );
    expect(email.send).toHaveBeenCalledWith(
      expect.objectContaining({ recipientEmail: 'requester@acme.test' }),
    );
    const emailCalls = email.send.mock.calls as unknown[][];
    const emailArgs = emailCalls[0][0] as { subject: string };
    expect(emailArgs.subject).toContain('approved');
  });

  it('blocking a request does not require governance checks and still notifies the requester', async () => {
    prisma.deploymentApproval.findFirst.mockResolvedValue(approval);
    prisma.deploymentApproval.update.mockResolvedValue({
      ...approval,
      status: DeploymentStatus.BLOCKED,
    });

    const result = await service.update(approval.id, orgId, actorId, {
      status: DeploymentStatus.BLOCKED,
      notes: 'Coverage gate still unmet',
    });

    expect(result.status).toBe(DeploymentStatus.BLOCKED);
    expect(prisma.governanceGate.count).not.toHaveBeenCalled();
    expect(notifications.notify).toHaveBeenCalledWith(
      expect.objectContaining({
        recipientId: requesterId,
        body: 'Coverage gate still unmet',
      }),
    );
    expect(notifications.notify.mock.calls[0][0].title).toContain('blocked');
    expect(webhooks.notify).toHaveBeenCalledWith(
      orgId,
      expect.stringContaining('blocked'),
    );
    expect(email.send).toHaveBeenCalledWith(
      expect.objectContaining({
        recipientEmail: 'requester@acme.test',
        body: 'Coverage gate still unmet',
      }),
    );
  });

  it('skips the email entirely if the requester user no longer exists', async () => {
    prisma.deploymentApproval.findFirst.mockResolvedValue(approval);
    prisma.governanceGate.count.mockResolvedValue(0);
    prisma.customerSignoff.count.mockResolvedValue(0);
    prisma.deploymentApproval.update.mockResolvedValue({
      ...approval,
      status: DeploymentStatus.APPROVED,
    });
    prisma.user.findUnique.mockResolvedValue(null);

    await service.update(approval.id, orgId, actorId, {
      status: DeploymentStatus.APPROVED,
    });

    expect(email.send).not.toHaveBeenCalled();
  });
});
