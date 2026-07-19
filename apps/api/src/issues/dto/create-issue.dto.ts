import {
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MinLength,
} from 'class-validator';
import { IssuePriority } from '../../../generated/prisma/client';

export class CreateIssueDto {
  @IsUUID()
  projectId: string;

  @IsString()
  @MinLength(2)
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(IssuePriority)
  priority: IssuePriority;
}
