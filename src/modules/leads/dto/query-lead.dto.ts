import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryLeadDto {
  @ApiPropertyOptional({
    example: 'all',
    enum: ['today', 'open', 'all', 'backlog', 'pending', 'calendar'],
    description: "Filter listings by custom view categories: 'today' (Todays follow-up), 'open' (Active Leads), 'all' (All Leads), 'backlog' (Outstanding/Missed follow-ups in the past), 'pending' (Awaiting follow-up), 'calendar' (Scheduled dates feed).",
    default: 'all',
  })
  @IsEnum(['today', 'open', 'all', 'backlog', 'pending', 'calendar'], { message: 'Invalid lead view type' })
  @IsOptional()
  viewType?: 'today' | 'open' | 'all' | 'backlog' | 'pending' | 'calendar' = 'all';

  @ApiPropertyOptional({
    example: 'Chirag',
    description: 'Search string matching customer name, phone, email, or requirements details',
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
    description: 'Sync Parameter: Fetch only lead records created or modified since this timestamp.',
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
    description: 'Number of results to retrieve per page. Set to 99999 to bypass pagination and sync all.',
    default: 10,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  limit?: number = 10;
}
