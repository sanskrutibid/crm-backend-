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

export class QueryLeadDto {
  @ApiPropertyOptional({
    example: 'all',
    enum: ['today', 'open', 'all', 'backlog', 'pending', 'calendar'],
    description:
      "Filter listings by custom view categories: 'today' (Todays follow-up), 'open' (Active Leads), 'all' (All Leads), 'backlog' (Outstanding/Missed follow-ups in the past), 'pending' (Awaiting follow-up), 'calendar' (Scheduled dates feed).",
    default: 'all',
  })
  @IsEnum(['today', 'open', 'all', 'backlog', 'pending', 'calendar'], {
    message: 'Invalid lead view type',
  })
  @IsOptional()
  viewType?: 'today' | 'open' | 'all' | 'backlog' | 'pending' | 'calendar' =
    'all';

  @ApiPropertyOptional({
    example: 'Chirag',
    description:
      'Search string matching customer name, phone, email, or requirements details',
  })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({
    example: '60d5ecb8b394142e88a38c21',
    description: 'Filter leads assigned to a specific CRM Agent User ID',
  })
  @IsString()
  @IsOptional()
  assignedTo?: string;

  @ApiPropertyOptional({
    example: '2026-05-26T12:00:00.000Z',
    description:
      'Sync Parameter: Fetch only lead records created or modified since this timestamp.',
  })
  @IsString()
  @IsOptional()
  updatedSince?: string;

  // ==========================================
  // Sorting & Ordering
  // ==========================================
  @ApiPropertyOptional({
    example: 'Create Date',
    enum: [
      'Assigned Date',
      'Create Date',
      'FollowUp Date',
      'Updated Date',
      'Name',
    ],
    description:
      'Field to sort leads by (Assigned Date, Create Date, FollowUp Date, Updated Date, Name)',
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
  // Advanced Search Filters
  // ==========================================
  @ApiPropertyOptional({
    example: 'Customer',
    description:
      'Filter by linked Contact Customer Type (Customer, Landlord, Shared, Broker)',
  })
  @IsString()
  @IsOptional()
  customerType?: string;

  @ApiPropertyOptional({
    example: 'Employee',
    description: 'Filter by linked Contact Type (Employee, Broker)',
  })
  @IsString()
  @IsOptional()
  contactType?: string;

  @ApiPropertyOptional({
    example: '2026-05-01',
    description: 'Filter by followup schedule start date (YYYY-MM-DD)',
  })
  @IsString()
  @IsOptional()
  followupDateFrom?: string;

  @ApiPropertyOptional({
    example: '2026-05-31',
    description: 'Filter by followup schedule end date (YYYY-MM-DD)',
  })
  @IsString()
  @IsOptional()
  followupDateTo?: string;

  @ApiPropertyOptional({
    example: '2026-05-01',
    description: 'Filter by creation start date (YYYY-MM-DD)',
  })
  @IsString()
  @IsOptional()
  createDateFrom?: string;

  @ApiPropertyOptional({
    example: '2026-05-31',
    description: 'Filter by creation end date (YYYY-MM-DD)',
  })
  @IsString()
  @IsOptional()
  createDateTo?: string;

  @ApiPropertyOptional({
    example: '2026-05-01',
    description: 'Filter by assignment start date (YYYY-MM-DD)',
  })
  @IsString()
  @IsOptional()
  assignedDateFrom?: string;

  @ApiPropertyOptional({
    example: '2026-05-31',
    description: 'Filter by assignment end date (YYYY-MM-DD)',
  })
  @IsString()
  @IsOptional()
  assignedDateTo?: string;

  @ApiPropertyOptional({
    example: '2026-05-01',
    description: 'Filter by update start date (YYYY-MM-DD)',
  })
  @IsString()
  @IsOptional()
  updateDateFrom?: string;

  @ApiPropertyOptional({
    example: '2026-05-31',
    description: 'Filter by update end date (YYYY-MM-DD)',
  })
  @IsString()
  @IsOptional()
  updateDateTo?: string;

  @ApiPropertyOptional({
    example: '60d5ecb8b394142e88a38c21',
    description: 'Filter by User ID who submitted the lead',
  })
  @IsString()
  @IsOptional()
  submittedBy?: string;

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
  location?: string;

  @ApiPropertyOptional({
    example: 'Follow-Up Scheduled',
    description: 'Filter by lead Purpose classification',
  })
  @IsString()
  @IsOptional()
  purpose?: string;

  @ApiPropertyOptional({
    example: 1.0,
    description: 'Filter by minimum Rating/Score ratio',
  })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  ratingFrom?: number;

  @ApiPropertyOptional({
    example: 5.0,
    description: 'Filter by maximum Rating/Score ratio',
  })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  ratingTo?: number;

  @ApiPropertyOptional({
    example: 'Campaigns',
    description: 'Filter by Lead Discovery Source',
  })
  @IsString()
  @IsOptional()
  source?: string;

  @ApiPropertyOptional({
    example: 'Global Team',
    description: 'Filter by assigned CRM Office Branch location name',
  })
  @IsString()
  @IsOptional()
  branch?: string;

  @ApiPropertyOptional({
    example: '60d5ecb8b394142e88a38c21',
    description: 'Filter by assigned User ID (alternative query parameter)',
  })
  @IsString()
  @IsOptional()
  assignTo?: string;

  @ApiPropertyOptional({
    example: 'In Progress',
    description: 'Filter by Current Status classification',
  })
  @IsString()
  @IsOptional()
  currentStatus?: string;

  @ApiPropertyOptional({
    example: 'In Progress',
    description: 'Filter by Lead Status classification',
  })
  @IsString()
  @IsOptional()
  status?: string;

  @ApiPropertyOptional({
    example: 'Client request',
    description: 'Filter by outcome or status reasons description',
  })
  @IsString()
  @IsOptional()
  reasons?: string;

  @ApiPropertyOptional({
    example: 'Private',
    enum: ['Private', 'Branch'],
    description: 'Filter by visibility permission',
  })
  @IsString()
  @IsOptional()
  permission?: string;

  @ApiPropertyOptional({
    example: 'Batch-101',
    description: 'Filter by batch identifier or keywords metadata',
  })
  @IsString()
  @IsOptional()
  batchNumber?: string;

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
