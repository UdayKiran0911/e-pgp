import { IsOptional, IsString, IsUUID, MinLength } from 'class-validator';

export class CreateChangeRequestDto {
  @IsUUID()
  projectId: string;

  @IsString()
  @MinLength(2)
  title: string;

  @IsOptional()
  @IsString()
  description?: string;
}
