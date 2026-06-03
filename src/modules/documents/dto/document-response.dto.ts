import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class DocumentResponseDto {
  @ApiProperty({
    example: '60d5ed7ab394142e88a38c29',
    description: 'Document unique database identifier ID',
  })
  id: string;

  @ApiProperty({
    example: 'General',
    description: 'Document type categorization',
  })
  type: string;

  @ApiProperty({
    example: 'Project Details Brochure',
    description: 'Title of the document',
  })
  title: string;

  @ApiPropertyOptional({
    example: 'Detailed plans and specifications for the new commercial residency.',
    description: 'Detailed description of the document contents',
  })
  description?: string;

  @ApiPropertyOptional({
    example: 34.42,
    description: 'Rating score value (e.g. out of 100)',
  })
  rating?: number;

  @ApiProperty({
    example: 'uploads/documents/brochure.pdf',
    description: 'URL link or file path of the uploaded document',
  })
  fileUrl: string;

  @ApiPropertyOptional({
    example: 'Marketing Materials',
    description: 'Folder category name',
  })
  folder?: string;

  @ApiProperty({
    example: 'Global Team',
    description: 'Assigned branch name',
  })
  branch: string;

  @ApiProperty({
    description: 'Assigned employee/agent user profile details',
  })
  assignee: any;

  @ApiProperty({
    example: true,
    description: 'Public visibility status flag',
  })
  isPublic: boolean;

  @ApiPropertyOptional({
    description: 'User profile details of document creator',
  })
  createdBy?: any;

  @ApiProperty({
    example: '2026-06-03T12:00:00.000Z',
    description: 'Timestamp when document was registered',
  })
  createdAt: string;

  @ApiProperty({
    example: '2026-06-03T12:00:00.000Z',
    description: 'Timestamp when document was last modified',
  })
  updatedAt: string;
}
