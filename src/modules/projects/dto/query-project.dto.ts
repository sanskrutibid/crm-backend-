import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsOptional,
  IsString,
  IsInt,
  Min,
  IsNumber,
} from 'class-validator';
import { Type } from 'class-transformer';

export class QueryProjectDto {
  @ApiPropertyOptional({
    example: 'all',
    enum: ['available', 'rera_hira', 'all'],
    description:
      "Filter listings by custom views: 'available' (Available Projects), 'rera_hira' (RERA / HIRA Registered Projects), 'all' (All Projects).",
    default: 'all',
  })
  @IsEnum(['available', 'rera_hira', 'all'], {
    message: 'Invalid project view type',
  })
  @IsOptional()
  viewType?: 'available' | 'rera_hira' | 'all' = 'all';

  @ApiPropertyOptional({
    example: 'Patil',
    description: 'Search matching project name, developer name, locality, keywords or description',
  })
  @IsString()
  @IsOptional()
  search?: string;

  // ==========================================
  // Advanced Search Fields (Screenshot 3)
  // ==========================================
  @ApiPropertyOptional({
    example: 'Patil Heights',
    description: 'Filter by exact or partial Project Name',
  })
  @IsString()
  @IsOptional()
  projectName?: string;

  @ApiPropertyOptional({
    example: 'PR/MH/NAG/2026/05',
    description: 'Filter by specific RERA/HIRA Number',
  })
  @IsString()
  @IsOptional()
  reraNumber?: string;

  @ApiPropertyOptional({
    example: 'Apartment',
    description: 'Filter by Project Type',
  })
  @IsString()
  @IsOptional()
  type?: string;

  @ApiPropertyOptional({
    example: '3 BHK',
    description: 'Filter by Total Rooms configuration',
  })
  @IsString()
  @IsOptional()
  totalRoom?: string;

  @ApiPropertyOptional({
    example: 2000000,
    description: 'Filter by minimum Price',
  })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  priceFrom?: number;

  @ApiPropertyOptional({
    example: 8500000,
    description: 'Filter by maximum Price',
  })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  priceTo?: number;

  @ApiPropertyOptional({
    example: 1000,
    description: 'Filter by minimum Area Range',
  })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  areaFrom?: number;

  @ApiPropertyOptional({
    example: 2500,
    description: 'Filter by maximum Area Range',
  })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  areaTo?: number;

  @ApiPropertyOptional({
    example: 'Sq.Ft.',
    description: 'Area unit selection (Sq.Ft., Sq.Meter, etc.)',
  })
  @IsString()
  @IsOptional()
  areaUnit?: string;

  @ApiPropertyOptional({
    example: 'Nagpur',
    description: 'Filter by City',
  })
  @IsString()
  @IsOptional()
  city?: string;

  @ApiPropertyOptional({
    example: 'Dhantoli',
    description: 'Filter by Location/Locality',
  })
  @IsString()
  @IsOptional()
  locality?: string;

  @ApiPropertyOptional({
    example: 'New Launch',
    description: 'Filter by Transaction category type',
  })
  @IsString()
  @IsOptional()
  transaction?: string;

  @ApiPropertyOptional({
    example: '60d5ec7ab394142e88a38c29',
    description: 'Filter by linked Customer (Project Owner Contact ID)',
  })
  @IsString()
  @IsOptional()
  customer?: string;

  @ApiPropertyOptional({
    example: '60d5ecb8b394142e88a38c21',
    description: 'Filter by User ID who submitted the project',
  })
  @IsString()
  @IsOptional()
  submittedBy?: string;

  @ApiPropertyOptional({
    example: 'Global Team',
    description: 'Filter by assigned CRM Office Branch location name',
  })
  @IsString()
  @IsOptional()
  branch?: string;

  @ApiPropertyOptional({
    example: '60d5ecb8b394142e88a38c21',
    description: 'Filter projects assigned to a specific CRM Agent User ID (Assign to)',
  })
  @IsString()
  @IsOptional()
  assignedTo?: string;

  @ApiPropertyOptional({
    example: '60d5ecb8b394142e88a38c21',
    description: 'Filter projects assigned to a specific CRM Agent User ID (alternative query)',
  })
  @IsString()
  @IsOptional()
  assignTo?: string;

  @ApiPropertyOptional({
    example: '2026-05-01',
    description: 'Filter by creation start date (YYYY-MM-DD)',
  })
  @IsString()
  @IsOptional()
  dateFrom?: string;

  @ApiPropertyOptional({
    example: '2026-05-31',
    description: 'Filter by creation end date (YYYY-MM-DD)',
  })
  @IsString()
  @IsOptional()
  dateTo?: string;

  @ApiPropertyOptional({
    example: 'Available',
    description: 'Filter by exact Project Status (Available, Sold Out)',
  })
  @IsString()
  @IsOptional()
  status?: string;

  @ApiPropertyOptional({
    example: 'regular',
    enum: ['regular', 'flexible'],
    description: 'Search mode execution classification (regular, flexible)',
    default: 'regular',
  })
  @IsString()
  @IsOptional()
  searchMode?: string;

  // ==========================================
  // Sorting & Ordering
  // ==========================================
  @ApiPropertyOptional({
    example: 'Create Date',
    enum: [
      'Create Date',
      'Customer Name',
      'Display Name',
      'Project Name',
      'Updated Date',
      'Location',
    ],
    description:
      'Field to sort projects by (Create Date, Customer Name, Display Name, Project Name, Updated Date, Location)',
    default: 'Create Date',
  })
  @IsString()
  @IsOptional()
  sortBy?: string;

  @ApiPropertyOptional({
    example: 'Desc',
    enum: ['Desc', 'Asc'],
    description: 'Sort ordering direction (Desc, Asc)',
    default: 'Desc',
  })
  @IsString()
  @IsOptional()
  orderBy?: string;

  // ==========================================
  // Pagination Parameters
  // ==========================================
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
}
