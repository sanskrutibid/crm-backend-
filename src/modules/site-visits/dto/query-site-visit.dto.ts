import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsInt, Min, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

export class QuerySiteVisitDto {
  @ApiPropertyOptional({
    example: 'Avinash',
    description: 'Search string matching visitor, site name, managers, remarks or branch location',
  })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({
    example: 'Avinash',
    description: 'Search keyword matching multiple text fields (alias for search)',
  })
  @IsString()
  @IsOptional()
  keyword?: string;

  @ApiPropertyOptional({
    example: 'First Visit',
    description: 'Filter by type of visit (e.g. First Visit, Re-visit)',
  })
  @IsString()
  @IsOptional()
  visitType?: string;

  @ApiPropertyOptional({
    example: 'Lead',
    description: 'Filter by associated module (e.g. Lead, Contact)',
  })
  @IsString()
  @IsOptional()
  module?: string;

  @ApiPropertyOptional({
    example: 'Scheduled',
    description: 'Filter by current visit status',
  })
  @IsString()
  @IsOptional()
  visitStatus?: string;

  @ApiPropertyOptional({
    example: 'Scheduled',
    description: 'Filter by status (alias for visitStatus)',
  })
  @IsString()
  @IsOptional()
  status?: string;

  @ApiPropertyOptional({
    example: 'Website Form',
    description: 'Filter by discovery source',
  })
  @IsString()
  @IsOptional()
  source?: string;

  @ApiPropertyOptional({
    example: 'Metro City Branch',
    description: 'Filter by CRM office branch location name',
  })
  @IsString()
  @IsOptional()
  branch?: string;

  @ApiPropertyOptional({
    example: '60d5ecb8b394142e88a38c21',
    description: 'Filter by assigned agent User ID (alias for assignTo)',
  })
  @IsString()
  @IsOptional()
  assignee?: string;

  @ApiPropertyOptional({
    example: '60d5ecb8b394142e88a38c21',
    description: 'Filter by assigned agent User ID',
  })
  @IsString()
  @IsOptional()
  assignTo?: string;

  @ApiPropertyOptional({
    example: '60d5ecb8b394142e88a38c22',
    description: 'Filter by user ID who submitted/created the visit',
  })
  @IsString()
  @IsOptional()
  submittedBy?: string;

  @ApiPropertyOptional({
    example: 'Metro City',
    description: 'Filter by property site name',
  })
  @IsString()
  @IsOptional()
  siteName?: string;

  @ApiPropertyOptional({
    example: '2026-06-01',
    description: 'Filter visits starting from this visit date (inclusive, format YYYY-MM-DD)',
  })
  @IsString()
  @IsOptional()
  visitDateFrom?: string;

  @ApiPropertyOptional({
    example: '2026-06-30',
    description: 'Filter visits up to this visit date (inclusive, format YYYY-MM-DD)',
  })
  @IsString()
  @IsOptional()
  visitDateTo?: string;

  @ApiPropertyOptional({
    example: '2026-06-01T00:00:00.000Z',
    description: 'Filter visits starting from this creation date (inclusive, ISO)',
  })
  @IsString()
  @IsOptional()
  createDateFrom?: string;

  @ApiPropertyOptional({
    example: '2026-06-30T23:59:59.000Z',
    description: 'Filter visits up to this creation date (inclusive, ISO)',
  })
  @IsString()
  @IsOptional()
  createDateTo?: string;

  @ApiPropertyOptional({
    example: 1,
    description: 'Filter visits starting from this number of locking days remaining',
  })
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  lockingDaysFrom?: number;

  @ApiPropertyOptional({
    example: 10,
    description: 'Filter visits up to this number of locking days remaining',
  })
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  lockingDaysTo?: number;

  @ApiPropertyOptional({
    example: 0,
    description: 'Filter visits starting from this number of re-visits',
  })
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  noOfReVisitFrom?: number;

  @ApiPropertyOptional({
    example: 5,
    description: 'Filter visits up to this number of re-visits',
  })
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  noOfReVisitTo?: number;

  @ApiPropertyOptional({
    example: 'Client satisfied',
    description: 'Filter by reasons or outcome matching substring',
  })
  @IsString()
  @IsOptional()
  reasons?: string;

  @ApiPropertyOptional({
    example: false,
    description: 'Filter by private visibility settings status',
  })
  @Type(() => Boolean)
  @IsBoolean()
  @IsOptional()
  isPrivate?: boolean;

  @ApiPropertyOptional({
    example: 'createdAt',
    description: "Field name to sort results by: 'createdAt' (Created Date), 'visitor' (Visitor Name) or 'visitStatus' (Status).",
    default: 'createdAt',
  })
  @IsString()
  @IsOptional()
  sortBy?: string = 'createdAt';

  @ApiPropertyOptional({
    example: 'desc',
    enum: ['asc', 'desc'],
    description: 'Sorting direction order: asc (ascending) or desc (descending).',
    default: 'desc',
  })
  @IsEnum(['asc', 'desc'], { message: "Sort order must be 'asc' or 'desc'" })
  @IsOptional()
  sortOrder?: 'asc' | 'desc' = 'desc';

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
    description: 'Number of results to retrieve per page.',
    default: 10,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  limit?: number = 10;
}
