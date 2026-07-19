import { IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { ChangeRequestStatus } from '../../../generated/prisma/client';

export class UpdateChangeRequestDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(ChangeRequestStatus)
  status?: ChangeRequestStatus;
}
