import { IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import {
  GovernanceStage,
  ProjectStatus,
} from '../../../generated/prisma/client';

export class UpdateProjectDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @IsOptional()
  @IsEnum(ProjectStatus)
  status?: ProjectStatus;

  @IsOptional()
  @IsEnum(GovernanceStage)
  governanceStage?: GovernanceStage;
}
