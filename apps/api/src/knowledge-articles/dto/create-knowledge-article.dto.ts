import { IsArray, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateKnowledgeArticleDto {
  @IsString()
  @MinLength(2)
  title: string;

  @IsString()
  @MinLength(2)
  category: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsString()
  @MinLength(2)
  content: string;
}
