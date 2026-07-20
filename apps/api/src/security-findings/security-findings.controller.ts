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
import { SecurityFindingsService } from './security-findings.service';
import { CreateSecurityFindingDto } from './dto/create-security-finding.dto';
import { UpdateSecurityFindingDto } from './dto/update-security-finding.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';
import { Role } from '../../generated/prisma/client';

@Controller('security-findings')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SecurityFindingsController {
  constructor(
    private readonly securityFindingsService: SecurityFindingsService,
  ) {}

  @Get()
  findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query('projectId') projectId?: string,
  ) {
    return this.securityFindingsService.findAllInOrganization(
      user.organizationId,
      projectId,
    );
  }

  @Get(':id')
  findOne(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.securityFindingsService.findOneInOrganization(
      id,
      user.organizationId,
    );
  }

  @Post()
  @Roles(Role.ADMIN, Role.GOVERNANCE_LEAD)
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateSecurityFindingDto,
  ) {
    return this.securityFindingsService.create(
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
    @Body() dto: UpdateSecurityFindingDto,
  ) {
    return this.securityFindingsService.update(
      id,
      user.organizationId,
      user.userId,
      dto,
    );
  }
}
