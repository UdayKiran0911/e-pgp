import { IsEnum, IsString, IsUUID, MinLength } from 'class-validator';
import { GateCategory } from '../../../generated/prisma/client';

export class CreateGovernanceGateDto {
  @IsUUID()
  projectId: string;

  @IsEnum(GateCategory)
  category: GateCategory;

  @IsString()
  @MinLength(2)
  title: string;
}
