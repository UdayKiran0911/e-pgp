import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ProjectHealthService } from './project-health.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';

@Controller('projects')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProjectHealthController {
  constructor(private readonly projectHealthService: ProjectHealthService) {}

  @Get(':projectId/health-score')
  getScore(
    @CurrentUser() user: AuthenticatedUser,
    @Param('projectId') projectId: string,
  ) {
    return this.projectHealthService.computeScore(
      user.organizationId,
      projectId,
    );
  }
}
