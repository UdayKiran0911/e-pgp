import { IsOptional, IsString, IsUUID, MinLength } from 'class-validator';

export class CreateDeploymentApprovalDto {
  @IsUUID()
  projectId: string;

  @IsString()
  @MinLength(2)
  title: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
