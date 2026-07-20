import { EmailService } from './email.service';
import { PrismaService } from '../prisma/prisma.service';

describe('EmailService', () => {
  let service: EmailService;
  let prisma: { emailLog: { create: jest.Mock; findMany: jest.Mock } };

  const orgId = 'org-1';

  beforeEach(() => {
    prisma = {
      emailLog: { create: jest.fn(), findMany: jest.fn() },
    };
    service = new EmailService(prisma as unknown as PrismaService);
  });

  it('logs an email instead of actually sending it', async () => {
    prisma.emailLog.create.mockResolvedValue({ id: 'log-1' });

    await service.send({
      organizationId: orgId,
      recipientEmail: 'requester@acme.test',
      subject: 'Deployment approved',
      body: 'Your deployment "Ship v2.0" was approved.',
    });

    expect(prisma.emailLog.create).toHaveBeenCalledWith({
      data: {
        organizationId: orgId,
        projectId: undefined,
        recipientEmail: 'requester@acme.test',
        subject: 'Deployment approved',
        body: 'Your deployment "Ship v2.0" was approved.',
      },
    });
  });

  it('lists email logs scoped to an organization, optionally filtered by project', async () => {
    prisma.emailLog.findMany.mockResolvedValue([]);

    await service.findAllInOrganization(orgId, 'project-1');

    expect(prisma.emailLog.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { organizationId: orgId, projectId: 'project-1' },
      }),
    );
  });
});
