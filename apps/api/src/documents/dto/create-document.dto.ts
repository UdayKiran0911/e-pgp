import {
  IsOptional,
  IsString,
  IsUUID,
  IsUrl,
  MinLength,
} from 'class-validator';

export class CreateDocumentDto {
  @IsUUID()
  projectId: string;

  @IsString()
  @MinLength(2)
  title: string;

  @IsUrl({ require_tld: false })
  url: string;

  @IsOptional()
  @IsString()
  version?: string;
}
