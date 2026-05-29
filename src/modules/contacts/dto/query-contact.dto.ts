import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryContactDto {
  @ApiPropertyOptional({
    example: 'Customer',
    description: "Filter by customer category classification (e.g. 'Customer', 'Landlord', 'Shared', 'Broker')",
  })
  @IsString()
  @IsOptional()
  customerType?: string;

  @ApiPropertyOptional({
    example: 'Employee',
    description: "Filter by contact category classification (e.g. 'Employee', 'Broker')",
  })
  @IsString()
  @IsOptional()
  contactType?: string;

  @ApiPropertyOptional({
    example: 'Global Team',
    description: 'Filter by office branch name',
  })
  @IsString()
  @IsOptional()
  branch?: string;

  @ApiPropertyOptional({
    example: '60d5ecb8b394142e88a38c21',
    description: 'Filter by assigned agent User ID',
  })
  @IsString()
  @IsOptional()
  assignedTo?: string;

  @ApiPropertyOptional({
    example: 'Dayamati',
    description: 'Search string matching firstName, lastName, mobile, email, uniqueNumber, or keywords',
  })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({
    example: 'createdAt',
    description: "Field name to sort results by (e.g. 'createdAt', 'firstName', 'rating', 'updatedAt').",
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
    example: '2026-05-26T12:00:00.000Z',
    description: 'Sync Parameter: Fetch only records created or modified since this timestamp (ISO 8601). Supports differential sync.',
  })
  @IsString()
  @IsOptional()
  updatedSince?: string;

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
    description: 'Number of results to retrieve per page. Set to 99999 to bypass pagination and download all for local client caching.',
    default: 10,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  limit?: number;
}
