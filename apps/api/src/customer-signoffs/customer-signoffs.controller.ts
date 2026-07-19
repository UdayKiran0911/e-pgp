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
import { CustomerSignoffsService } from './customer-signoffs.service';
import { CreateCustomerSignoffDto } from './dto/create-customer-signoff.dto';
import { UpdateCustomerSignoffDto } from './dto/update-customer-signoff.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';
import { Role } from '../../generated/prisma/client';

@Controller('customer-signoffs')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CustomerSignoffsController {
  constructor(
    private readonly customerSignoffsService: CustomerSignoffsService,
  ) {}

  @Get()
  findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query('projectId') projectId?: string,
  ) {
    return this.customerSignoffsService.findAllInOrganization(
      user.organizationId,
      projectId,
    );
  }

  @Get(':id')
  findOne(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.customerSignoffsService.findOneInOrganization(
      id,
      user.organizationId,
    );
  }

  @Post()
  @Roles(Role.ADMIN, Role.GOVERNANCE_LEAD)
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateCustomerSignoffDto,
  ) {
    return this.customerSignoffsService.create(
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
    @Body() dto: UpdateCustomerSignoffDto,
  ) {
    return this.customerSignoffsService.update(
      id,
      user.organizationId,
      user.userId,
      dto,
    );
  }
}
