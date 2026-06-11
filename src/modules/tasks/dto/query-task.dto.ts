import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsInt, Min } from 'class-validator';
import { TaskStatus, TaskPriority } from '../schemas/task.schema';
import { Type } from 'class-transformer';

export class QueryTaskDto {
  @ApiPropertyOptional({
    example: TaskStatus.OPEN,
    enum: TaskStatus,
    description: "Filter by status: 'Open' or 'Closed'. Leave empty for 'All'.",
  })
  @IsEnum(TaskStatus, { message: 'Invalid task status' })
  @IsOptional()
  status?: TaskStatus;

  @ApiPropertyOptional({
    example: TaskPriority.MEDIUM,
    enum: TaskPriority,
    description: 'Filter by priority level',
  })
  @IsEnum(TaskPriority, { message: 'Invalid task priority' })
  @IsOptional()
  priority?: TaskPriority;


  @ApiPropertyOptional({
    example: 'Priya',
    description: 'Search string matching task summary title or description',
  })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({
    example: '60d5ecb8b394142e88a38c21',
    description: 'Filter tasks assigned to a specific CRM Agent User ID',
  })
  @IsString()
  @IsOptional()
  assignedTo?: string;

  @ApiPropertyOptional({
    example: 'createdAt',
    description:
      "Field name to sort tasks by: 'createdAt' (Created Date) or 'scheduledDate' (Event execution date).",
    default: 'createdAt',
  })
  @IsString()
  @IsOptional()
  sortBy?: string = 'createdAt';

  @ApiPropertyOptional({
    example: 'desc',
    enum: ['asc', 'desc'],
    description:
      'Sorting direction order: asc (ascending) or desc (descending).',
    default: 'desc',
  })
  @IsEnum(['asc', 'desc'], { message: "Sort order must be 'asc' or 'desc'" })
  @IsOptional()
  sortOrder?: 'asc' | 'desc' = 'desc';

  @ApiPropertyOptional({
    example: '2026-05-26T12:00:00.000Z',
    description:
      'Sync Parameter: Fetch only task records added or modified since this timestamp.',
  })
  @IsString()
  @IsOptional()
  updatedSince?: string;

  @ApiPropertyOptional({
    example: 'Global Team',
    description: 'Filter tasks by branch name',
  })
  @IsString()
  @IsOptional()
  branch?: string;

  @ApiPropertyOptional({
    example: '2026-05-26',
    description: 'Filter tasks starting from this scheduled date (YYYY-MM-DD)',
  })
  @IsString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({
    example: '2026-05-30',
    description: 'Filter tasks up to this scheduled date (YYYY-MM-DD)',
  })
  @IsString()
  @IsOptional()
  endDate?: string;

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
    description:
      'Number of results to retrieve per page. Set to 99999 to bypass pagination and sync all.',
    default: 10,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  limit?: number;
}
