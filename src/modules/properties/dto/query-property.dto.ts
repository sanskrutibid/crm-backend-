import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsInt, Min, IsArray } from 'class-validator';
import { PropertyStatus } from '../schemas/property.schema';
import { Type } from 'class-transformer';

export class QueryPropertyDto {
  @ApiPropertyOptional({
    example: PropertyStatus.AVAILABLE,
    enum: PropertyStatus,
    description: 'Filter by sales availability status',
  })
  @IsEnum(PropertyStatus, { message: 'Invalid property status' })
  @IsOptional()
  status?: PropertyStatus;

  @ApiPropertyOptional({
    example: 'Greenwood',
    description: 'Search string matching name, location or builder',
  })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({
    example: '2026-05-26T12:00:00.000Z',
    description:
      'Sync Parameter: Fetch only property listings added or modified since this timestamp.',
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
  page?: number = 1;

  @ApiPropertyOptional({
    example: 10,
    description:
      'Number of results to retrieve per page. Set to 99999 to bypass pagination and sync all.',
    default: 10,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  limit?: number = 10;

  @ApiPropertyOptional({
    example: 'Create Date',
    enum: [
      'Create Date',
      'Requested Date',
      'Customer Name',
      'Building',
      'Updated Date',
      'Price',
      'Area',
      'Location',
      'Property Type',
    ],
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

export class GroupDeletePropertiesDto {
  @IsArray()
  @IsString({ each: true })
  propertyIds: string[];
}
