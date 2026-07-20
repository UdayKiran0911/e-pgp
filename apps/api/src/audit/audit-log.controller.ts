import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuditLogService } from './audit-log.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';
import { Role } from '../../generated/prisma/client';

@Controller('audit-logs')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.GOVERNANCE_LEAD, Role.AUDITOR)
export class AuditLogController {
  constructor(private readonly auditLog: AuditLogService) {}

  @Get()
  findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.auditLog.findAllInOrganization(user.organizationId);
  }

  @Get('summary')
  summarize(
    @CurrentUser() user: AuthenticatedUser,
    @Query('projectId') projectId?: string,
  ) {
    return this.auditLog.summarize(user.organizationId, projectId);
  }
}
