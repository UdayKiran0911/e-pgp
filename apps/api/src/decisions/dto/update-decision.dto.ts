import { IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateDecisionDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  title?: string;

  @IsOptional()
  @IsString()
  context?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  decision?: string;
}
