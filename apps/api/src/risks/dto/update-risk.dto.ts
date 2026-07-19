import { IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import {
  RiskLikelihood,
  RiskSeverity,
  RiskStatus,
} from '../../../generated/prisma/client';

export class UpdateRiskDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(RiskSeverity)
  severity?: RiskSeverity;

  @IsOptional()
  @IsEnum(RiskLikelihood)
  likelihood?: RiskLikelihood;

  @IsOptional()
  @IsEnum(RiskStatus)
  status?: RiskStatus;
}
