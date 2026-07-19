import { IsString, IsUUID, MinLength } from 'class-validator';

export class CreateChecklistItemDto {
  @IsUUID()
  projectId: string;

  @IsString()
  @MinLength(2)
  title: string;
}
