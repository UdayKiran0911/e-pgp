import { IsString, MinLength } from 'class-validator';

export class CreateSopDto {
  @IsString()
  @MinLength(2)
  title: string;

  @IsString()
  @MinLength(2)
  category: string;

  @IsString()
  @MinLength(2)
  content: string;
}
