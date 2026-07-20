import { IsUUID } from 'class-validator';

export class ApplyChecklistTemplateDto {
  @IsUUID()
  projectId: string;
}
