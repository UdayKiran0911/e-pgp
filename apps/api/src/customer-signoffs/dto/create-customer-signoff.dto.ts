import { IsString, IsUUID, MinLength } from 'class-validator';

export class CreateCustomerSignoffDto {
  @IsUUID()
  projectId: string;

  @IsString()
  @MinLength(2)
  title: string;

  @IsString()
  @MinLength(2)
  customerName: string;
}
