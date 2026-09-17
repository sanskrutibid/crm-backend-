import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryReportDto {
  @ApiPropertyOptional({
    example: 'Adhoc Report',
    description:
      'Filter reports by type (e.g. Adhoc Report, Daily Report, Weekly Report, Monthly Report)',
  })
  @IsString()
  @IsOptional()
  type?: string;

  @ApiPropertyOptional({
    example: 'Active',
    description: 'Filter reports by validity status (e.g. Active, Inactive)',
  })
  @IsString()
  @IsOptional()
  validity?: string;

  @ApiPropertyOptional({
    example: 'CRM Productivity',
    description: 'Search string matching report name or description',
  })
  @IsString()
  @IsOptional()
  search?: string;

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
      'Number of results to retrieve per page. Set to 99999 to bypass pagination.',
    default: 10,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  limit?: number = 10;

  @ApiPropertyOptional({
    example: 'Create Date',
    enum: ['Create Date', 'Name', 'Type'],
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
