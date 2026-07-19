import { IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { DeploymentStatus } from '../../../generated/prisma/client';

export class UpdateDeploymentApprovalDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  title?: string;

  @IsOptional()
  @IsEnum(DeploymentStatus)
  status?: DeploymentStatus;

  @IsOptional()
  @IsString()
  notes?: string;
}
