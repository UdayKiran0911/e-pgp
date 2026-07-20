import { IsEnum, IsString, IsUUID, IsUrl, MinLength } from 'class-validator';
import { ExternalReferenceProvider } from '../../../generated/prisma/client';

export class CreateExternalReferenceDto {
  @IsUUID()
  issueId: string;

  @IsEnum(ExternalReferenceProvider)
  provider: ExternalReferenceProvider;

  @IsString()
  @MinLength(1)
  externalId: string;

  @IsUrl({ require_tld: false })
  url: string;
}
