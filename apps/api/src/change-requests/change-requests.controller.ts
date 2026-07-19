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
import { ChangeRequestsService } from './change-requests.service';
import { CreateChangeRequestDto } from './dto/create-change-request.dto';
import { UpdateChangeRequestDto } from './dto/update-change-request.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';
import { Role } from '../../generated/prisma/client';

@Controller('change-requests')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ChangeRequestsController {
  constructor(private readonly changeRequestsService: ChangeRequestsService) {}

  @Get()
  findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query('projectId') projectId?: string,
  ) {
    return this.changeRequestsService.findAllInOrganization(
      user.organizationId,
      projectId,
    );
  }

  @Get(':id')
  findOne(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.changeRequestsService.findOneInOrganization(
      id,
      user.organizationId,
    );
  }

  // Any authenticated org member can submit a change request — the
  // approval workflow (Roles-gated below) is where governance kicks in.
  @Post()
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateChangeRequestDto,
  ) {
    return this.changeRequestsService.create(
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
    @Body() dto: UpdateChangeRequestDto,
  ) {
    return this.changeRequestsService.update(
      id,
      user.organizationId,
      user.userId,
      dto,
    );
  }
}
