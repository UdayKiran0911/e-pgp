import {
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MinLength,
} from 'class-validator';
import { ReviewType } from '../../../generated/prisma/client';

export class CreateReviewDto {
  @IsUUID()
  projectId: string;

  @IsEnum(ReviewType)
  type: ReviewType;

  @IsString()
  @MinLength(2)
  title: string;

  @IsOptional()
  @IsString()
  description?: string;
}
