import { IsOptional, IsString, IsUUID, MinLength } from 'class-validator';

export class CreateDecisionDto {
  @IsUUID()
  projectId: string;

  @IsString()
  @MinLength(2)
  title: string;

  @IsOptional()
  @IsString()
  context?: string;

  @IsString()
  @MinLength(2)
  decision: string;
}
