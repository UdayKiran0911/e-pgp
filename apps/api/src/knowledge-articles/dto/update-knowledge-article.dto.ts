import { IsArray, IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateKnowledgeArticleDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  title?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  category?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsString()
  @MinLength(2)
  content?: string;
}
