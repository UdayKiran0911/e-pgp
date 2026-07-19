import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { DeploymentApprovalsService } from './deployment-approvals.service';
import { CreateDeploymentApprovalDto } from './dto/create-deployment-approval.dto';
import { UpdateDeploymentApprovalDto } from './dto/update-deployment-approval.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';
import { Role } from '../../generated/prisma/client';

@Controller('deployment-approvals')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DeploymentApprovalsController {
  constructor(
    private readonly deploymentApprovalsService: DeploymentApprovalsService,
  ) {}

  @Get()
  findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query('projectId') projectId?: string,
  ) {
    return this.deploymentApprovalsService.findAllInOrganization(
      user.organizationId,
      projectId,
    );
  }

  @Get(':id')
  findOne(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.deploymentApprovalsService.findOneInOrganization(
      id,
      user.organizationId,
    );
  }

  // Any authenticated org member can request a deployment approval — the
  // decision (Roles-gated below) is where governance kicks in.
  @Post()
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateDeploymentApprovalDto,
  ) {
    return this.deploymentApprovalsService.create(
      user.organizationId,
      user.userId,
      dto,
    );
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.GOVERNANCE_LEAD)
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateDeploymentApprovalDto,
  ) {
    return this.deploymentApprovalsService.update(
      id,
      user.organizationId,
      user.userId,
      dto,
    );
  }
}
