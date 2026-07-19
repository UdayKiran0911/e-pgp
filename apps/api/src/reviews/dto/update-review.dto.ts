import { IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { ReviewStatus } from '../../../generated/prisma/client';

export class UpdateReviewDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(ReviewStatus)
  status?: ReviewStatus;
}
