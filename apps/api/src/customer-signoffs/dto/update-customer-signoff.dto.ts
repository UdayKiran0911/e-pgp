import { IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { SignoffStatus } from '../../../generated/prisma/client';

export class UpdateCustomerSignoffDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  title?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  customerName?: string;

  @IsOptional()
  @IsEnum(SignoffStatus)
  status?: SignoffStatus;

  @IsOptional()
  @IsString()
  notes?: string;
}
