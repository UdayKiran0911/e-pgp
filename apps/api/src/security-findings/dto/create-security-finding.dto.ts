import {
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MinLength,
} from 'class-validator';
import { SecurityFindingSeverity } from '../../../generated/prisma/client';

export class CreateSecurityFindingDto {
  @IsUUID()
  projectId: string;

  @IsString()
  @MinLength(2)
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(SecurityFindingSeverity)
  severity: SecurityFindingSeverity;
}
