import { IsBoolean, IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateChecklistItemDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  title?: string;

  @IsOptional()
  @IsBoolean()
  isDone?: boolean;
}
