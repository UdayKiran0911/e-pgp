import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { PluginsService } from './plugins.service';
import { CreatePluginManifestDto } from './dto/create-plugin-manifest.dto';
import { UpdatePluginManifestDto } from './dto/update-plugin-manifest.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';
import { Role } from '../../generated/prisma/client';

@Controller('plugins')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PluginsController {
  constructor(private readonly pluginsService: PluginsService) {}

  @Get()
  findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.pluginsService.findAllInOrganization(user.organizationId);
  }

  @Post()
  @Roles(Role.ADMIN)
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreatePluginManifestDto,
  ) {
    return this.pluginsService.create(user.organizationId, user.userId, dto);
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdatePluginManifestDto,
  ) {
    return this.pluginsService.update(
      id,
      user.organizationId,
      user.userId,
      dto,
    );
  }
}
