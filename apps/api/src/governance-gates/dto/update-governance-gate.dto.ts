import { IsBoolean, IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateGovernanceGateDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  title?: string;

  @IsOptional()
  @IsBoolean()
  isMet?: boolean;
}
