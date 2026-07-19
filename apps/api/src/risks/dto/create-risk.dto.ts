import {
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MinLength,
} from 'class-validator';
import { RiskLikelihood, RiskSeverity } from '../../../generated/prisma/client';

export class CreateRiskDto {
  @IsUUID()
  projectId: string;

  @IsString()
  @MinLength(2)
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(RiskSeverity)
  severity: RiskSeverity;

  @IsEnum(RiskLikelihood)
  likelihood: RiskLikelihood;
}
