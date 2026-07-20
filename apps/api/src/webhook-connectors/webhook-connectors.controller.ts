import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { WebhookConnectorsService } from './webhook-connectors.service';
import { CreateWebhookConnectorDto } from './dto/create-webhook-connector.dto';
import { UpdateWebhookConnectorDto } from './dto/update-webhook-connector.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';
import { Role } from '../../generated/prisma/client';

@Controller('webhook-connectors')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class WebhookConnectorsController {
  constructor(
    private readonly webhookConnectorsService: WebhookConnectorsService,
  ) {}

  @Get()
  findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.webhookConnectorsService.findAllInOrganization(
      user.organizationId,
    );
  }

  @Post()
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateWebhookConnectorDto,
  ) {
    return this.webhookConnectorsService.create(
      user.organizationId,
      user.userId,
      dto,
    );
  }

  @Patch(':id')
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateWebhookConnectorDto,
  ) {
    return this.webhookConnectorsService.update(
      id,
      user.organizationId,
      user.userId,
      dto,
    );
  }
}
