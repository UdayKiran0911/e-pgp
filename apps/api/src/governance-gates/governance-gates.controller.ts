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
import { GovernanceGatesService } from './governance-gates.service';
import { CreateGovernanceGateDto } from './dto/create-governance-gate.dto';
import { UpdateGovernanceGateDto } from './dto/update-governance-gate.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';
import { Role } from '../../generated/prisma/client';

@Controller('governance-gates')
@UseGuards(JwtAuthGuard, RolesGuard)
export class GovernanceGatesController {
  constructor(
    private readonly governanceGatesService: GovernanceGatesService,
  ) {}

  @Get()
  findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query('projectId') projectId?: string,
  ) {
    return this.governanceGatesService.findAllInOrganization(
      user.organizationId,
      projectId,
    );
  }

  @Get(':id')
  findOne(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.governanceGatesService.findOneInOrganization(
      id,
      user.organizationId,
    );
  }

  @Post()
  @Roles(Role.ADMIN, Role.GOVERNANCE_LEAD)
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateGovernanceGateDto,
  ) {
    return this.governanceGatesService.create(
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
    @Body() dto: UpdateGovernanceGateDto,
  ) {
    return this.governanceGatesService.update(
      id,
      user.organizationId,
      user.userId,
      dto,
    );
  }
}
