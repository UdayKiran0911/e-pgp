import {
  IsEnum,
  IsObject,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
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

  // Flexible custom fields (Phase 4 Module 7): an opaque key/value object —
  // no per-key schema, values are trusted as given. Replaces the whole
  // object on update (not a per-key merge), same as every other field here.
  @IsOptional()
  @IsObject()
  metadata?: Record<string, string>;
}
