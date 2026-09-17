import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsInt, Min } from 'class-validator';
import { HistoryPriority } from '../schemas/history.schema';
import { Type } from 'class-transformer';

export class QueryHistoryDto {
  @ApiPropertyOptional({
    example: '60d5ecb8b394142e88a38c21',
    description: 'Filter by client (contact) ID',
  })
  @IsString()
  @IsOptional()
  contactId?: string;

  @ApiPropertyOptional({
    example: HistoryPriority.LOW,
    enum: HistoryPriority,
    description: 'Filter by conversation priority',
  })
  @IsEnum(HistoryPriority, { message: 'Invalid history priority value' })
  @IsOptional()
  priority?: HistoryPriority;

  @ApiPropertyOptional({
    example: '60d5ecb8b394142e88a38c22',
    description: 'Filter by related Project ID',
  })
  @IsString()
  @IsOptional()
  projectId?: string;

  @ApiPropertyOptional({
    example: 'Vrindavan',
    description: 'Filter by Project Name (fuzzy search)',
  })
  @IsString()
  @IsOptional()
  projectName?: string;

  @ApiPropertyOptional({
    example: 'Bandra',
    description: 'Filter by conversation/meeting location (fuzzy search)',
  })
  @IsString()
  @IsOptional()
  location?: string;

  @ApiPropertyOptional({
    example: 'Nagpur',
    description:
      "Filter by client's location (checks client's city or locality)",
  })
  @IsString()
  @IsOptional()
  clientLocation?: string;

  @ApiPropertyOptional({
    example: 'pricing',
    description: 'Search text within the conversation field',
  })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({
    example: 'date',
    description:
      "Field name to sort histories by: 'date', 'priority', or 'createdAt'.",
    default: 'date',
  })
  @IsString()
  @IsOptional()
  sortBy?: string = 'date';

  @ApiPropertyOptional({
    example: 'desc',
    enum: ['asc', 'desc'],
    description: 'Sorting direction: asc (ascending) or desc (descending).',
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
  page?: number;

  @ApiPropertyOptional({
    example: 10,
    description: 'Number of results to retrieve per page.',
    default: 10,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  limit?: number;
}
