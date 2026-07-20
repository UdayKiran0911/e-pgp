import { IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import {
  SecurityFindingSeverity,
  SecurityFindingStatus,
} from '../../../generated/prisma/client';

export class UpdateSecurityFindingDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(SecurityFindingSeverity)
  severity?: SecurityFindingSeverity;

  @IsOptional()
  @IsEnum(SecurityFindingStatus)
  status?: SecurityFindingStatus;
}
