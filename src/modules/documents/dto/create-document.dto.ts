import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsNumber,
  IsBoolean,
  Min,
  Max,
} from 'class-validator';

export class CreateDocumentDto {
  @ApiProperty({
    example: 'General',
    description: 'Document category/classification type (e.g. General, Brochure, Legal, Other)',
    default: 'General',
  })
  @IsString()
  @IsNotEmpty({ message: 'Type is required' })
  type: string;

  @ApiProperty({
    example: 'Project Details Brochure',
    description: 'Title of the document',
  })
  @IsString()
  @IsNotEmpty({ message: 'Title is required' })
  title: string;

  @ApiPropertyOptional({
    example: 'Detailed plans and specifications for the new commercial residency.',
    description: 'Detailed description of the document contents',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    example: 34.42,
    description: 'Rating of the document (slider value)',
  })
  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  rating?: number;

  @ApiProperty({
    example: 'uploads/documents/brochure.pdf',
    description: 'File URL or file path of the uploaded document',
  })
  @IsString()
  @IsNotEmpty({ message: 'Document file is required' })
  fileUrl: string;

  @ApiPropertyOptional({
    example: 'Marketing Materials',
    description: 'Specific category folder name',
  })
  @IsString()
  @IsOptional()
  folder?: string;

  @ApiProperty({
    example: 'Mumbai Branch',
    description: 'Branch assignment name',
  })
  @IsString()
  @IsNotEmpty({ message: 'Branch is required' })
  branch: string;

  @ApiProperty({
    example: '60d5ecb8b394142e88a38c20',
    description: 'User ID of assigned owner/handler',
  })
  @IsString()
  @IsNotEmpty({ message: 'Assignee is required' })
  assignee: string;

  @ApiPropertyOptional({
    example: true,
    description: 'Is this document public or private',
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  isPublic?: boolean;
}
