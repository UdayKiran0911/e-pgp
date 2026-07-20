import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface SendEmailParams {
  organizationId: string;
  projectId?: string;
  recipientEmail: string;
  subject: string;
  body: string;
}

// Email Engine (Phase 8 Module 3), simplified: an append-only outbox log
// rather than a real transactional-email-provider integration. Every
// "send" is recorded in EmailLog instead of actually leaving the
// building. Picking a real provider (SendGrid, Postmark, SES) is a
// separate decision, deliberately not made here — this establishes the
// templating + call-site wiring so swapping in a real provider later is a
// change to this one method, not every caller.
@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(private readonly prisma: PrismaService) {}

  async send(params: SendEmailParams) {
    const log = await this.prisma.emailLog.create({
      data: {
        organizationId: params.organizationId,
        projectId: params.projectId,
        recipientEmail: params.recipientEmail,
        subject: params.subject,
        body: params.body,
      },
    });
    this.logger.log(
      `Email logged (not actually sent) to ${params.recipientEmail}: ${params.subject}`,
    );
    return log;
  }

  findAllInOrganization(organizationId: string, projectId?: string) {
    return this.prisma.emailLog.findMany({
      where: { organizationId, ...(projectId ? { projectId } : {}) },
      orderBy: { createdAt: 'desc' },
    });
  }
}
