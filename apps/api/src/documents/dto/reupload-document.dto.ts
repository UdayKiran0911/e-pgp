import { IsOptional, IsString } from 'class-validator';

// Multipart form fields (the file itself arrives separately via
// @UploadedFile(), not through this DTO). No `projectId`/`title` — those
// stay fixed on the existing Document row; only the file content and
// version label change on re-upload.
export class ReuploadDocumentDto {
  @IsOptional()
  @IsString()
  version?: string;
}
