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
import { RisksService } from './risks.service';
import { CreateRiskDto } from './dto/create-risk.dto';
import { UpdateRiskDto } from './dto/update-risk.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';
import { Role } from '../../generated/prisma/client';

@Controller('risks')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RisksController {
  constructor(private readonly risksService: RisksService) {}

  @Get()
  findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query('projectId') projectId?: string,
  ) {
    return this.risksService.findAllInOrganization(
      user.organizationId,
      projectId,
    );
  }

  @Get(':id')
  findOne(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.risksService.findOneInOrganization(id, user.organizationId);
  }

  @Post()
  @Roles(Role.ADMIN, Role.GOVERNANCE_LEAD)
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateRiskDto) {
    return this.risksService.create(user.organizationId, user.userId, dto);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.GOVERNANCE_LEAD)
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateRiskDto,
  ) {
    return this.risksService.update(id, user.organizationId, user.userId, dto);
  }
}
