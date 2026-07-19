import { IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { IssuePriority, IssueStatus } from '../../../generated/prisma/client';

export class UpdateIssueDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(IssuePriority)
  priority?: IssuePriority;

  @IsOptional()
  @IsEnum(IssueStatus)
  status?: IssueStatus;
}
