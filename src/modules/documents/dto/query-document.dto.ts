import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryDocumentDto {
  @ApiPropertyOptional({
    example: 'General',
    description:
      'Filter by document category type (e.g. General, Brochure, Legal, Other)',
  })
  @IsString()
  @IsOptional()
  type?: string;

  @ApiPropertyOptional({
    example: 'Project Details',
    description: 'Search string matching title, description, or folder',
  })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({
    example: 'Marketing Materials',
    description: 'Filter by specific folder name',
  })
  @IsString()
  @IsOptional()
  folder?: string;

  @ApiPropertyOptional({
    example: 'Global Team',
    description: 'Filter by branch assignment',
  })
  @IsString()
  @IsOptional()
  branch?: string;

  @ApiPropertyOptional({
    example: '60d5ecb8b394142e88a38c20',
    description: 'Filter by assigned user ID',
  })
  @IsString()
  @IsOptional()
  assignee?: string;

  @ApiPropertyOptional({
    example: 1,
    description: 'Page index for pagination',
    default: 1,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({
    example: 10,
    description:
      'Number of results per page. Set to 99999 to bypass pagination.',
    default: 10,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  limit?: number = 10;

  @ApiPropertyOptional({
    example: 'Create Date',
    enum: ['Create Date', 'Title', 'Updated Date'],
    description: 'Field to sort query records by',
    default: 'Create Date',
  })
  @IsString()
  @IsOptional()
  sortBy?: string = 'Create Date';

  @ApiPropertyOptional({
    example: 'Desc',
    enum: ['Asc', 'Desc'],
    description: 'Sorting sort direction order: Ascending or Descending',
    default: 'Desc',
  })
  @IsString()
  @IsOptional()
  orderBy?: 'Asc' | 'Desc' = 'Desc';
}
