import { IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { ProjectStatus } from '../../../generated/prisma/client';

export class UpdateProjectDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @IsOptional()
  @IsEnum(ProjectStatus)
  status?: ProjectStatus;
}
