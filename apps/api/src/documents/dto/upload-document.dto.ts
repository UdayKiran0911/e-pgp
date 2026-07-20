import { IsOptional, IsString, IsUUID, MinLength } from 'class-validator';

// Multipart form fields (the file itself arrives separately via
// @UploadedFile(), not through this DTO).
export class UploadDocumentDto {
  @IsUUID()
  projectId: string;

  @IsString()
  @MinLength(2)
  title: string;

  @IsOptional()
  @IsString()
  version?: string;
}
