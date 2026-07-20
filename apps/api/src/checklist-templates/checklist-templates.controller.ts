import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ChecklistTemplatesService } from './checklist-templates.service';
import { CreateChecklistTemplateDto } from './dto/create-checklist-template.dto';
import { UpdateChecklistTemplateDto } from './dto/update-checklist-template.dto';
import { ApplyChecklistTemplateDto } from './dto/apply-checklist-template.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';
import { Role } from '../../generated/prisma/client';

@Controller('checklist-templates')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ChecklistTemplatesController {
  constructor(
    private readonly checklistTemplatesService: ChecklistTemplatesService,
  ) {}

  @Get()
  findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.checklistTemplatesService.findAllInOrganization(
      user.organizationId,
    );
  }

  @Get(':id')
  findOne(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.checklistTemplatesService.findOneInOrganization(
      id,
      user.organizationId,
    );
  }

  @Post()
  @Roles(Role.ADMIN, Role.GOVERNANCE_LEAD)
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateChecklistTemplateDto,
  ) {
    return this.checklistTemplatesService.create(
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
    @Body() dto: UpdateChecklistTemplateDto,
  ) {
    return this.checklistTemplatesService.update(
      id,
      user.organizationId,
      user.userId,
      dto,
    );
  }

  @Post(':id/apply')
  @Roles(Role.ADMIN, Role.GOVERNANCE_LEAD)
  apply(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: ApplyChecklistTemplateDto,
  ) {
    return this.checklistTemplatesService.apply(
      user.organizationId,
      user.userId,
      id,
      dto,
    );
  }
}
