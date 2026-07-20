import { IsEnum, IsString, IsUrl, MinLength } from 'class-validator';
import { WebhookProvider } from '../../../generated/prisma/client';

export class CreateWebhookConnectorDto {
  @IsString()
  @MinLength(2)
  name: string;

  @IsEnum(WebhookProvider)
  provider: WebhookProvider;

  @IsUrl({ require_tld: false })
  url: string;
}
