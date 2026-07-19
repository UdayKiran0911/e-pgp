import { IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { RequirementStatus } from '../../../generated/prisma/client';

export class UpdateRequirementDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(RequirementStatus)
  status?: RequirementStatus;
}
