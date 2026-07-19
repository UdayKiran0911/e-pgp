import { IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateSopDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  title?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  category?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  content?: string;
}
