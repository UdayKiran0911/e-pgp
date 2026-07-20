import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ExternalReferencesService } from './external-references.service';
import { CreateExternalReferenceDto } from './dto/create-external-reference.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';
import { Role } from '../../generated/prisma/client';

@Controller('external-references')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ExternalReferencesController {
  constructor(private readonly service: ExternalReferencesService) {}

  @Get()
  findAllForIssue(
    @CurrentUser() user: AuthenticatedUser,
    @Query('issueId') issueId: string,
  ) {
    return this.service.findAllForIssue(issueId, user.organizationId);
  }

  @Post()
  @Roles(Role.ADMIN, Role.GOVERNANCE_LEAD)
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateExternalReferenceDto,
  ) {
    return this.service.create(user.organizationId, user.userId, dto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.GOVERNANCE_LEAD)
  remove(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.service.remove(id, user.organizationId, user.userId);
  }
}
