import { IsObject, IsOptional, IsString, MinLength } from 'class-validator';

export class CreatePluginManifestDto {
  @IsString()
  @MinLength(2)
  name: string;

  @IsString()
  @MinLength(1)
  version: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsObject()
  manifest: Record<string, unknown>;
}
