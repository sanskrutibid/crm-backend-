import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class QuerySmsDto {
  @ApiPropertyOptional({
    example: 'Welcome',
    description: 'Search string matching message content or mobile numbers',
  })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({
    example: 'Welcome',
    description:
      'Search keyword matching message content or mobile numbers (alias for search)',
  })
  @IsString()
  @IsOptional()
  keyword?: string;

  @ApiPropertyOptional({
    example: 'Sent',
    enum: ['Pending', 'Sent', 'Failed'],
    description: 'Filter by SMS delivery status',
  })
  @IsEnum(['Pending', 'Sent', 'Failed'], {
    message: "Status must be 'Pending', 'Sent', or 'Failed'",
  })
  @IsOptional()
  status?: string;

  @ApiPropertyOptional({
    example: 'scheduleTime',
    description:
      'Field name to sort results by (e.g. scheduleTime, message, status, createdAt)',
    default: 'scheduleTime',
  })
  @IsString()
  @IsOptional()
  sortBy?: string = 'scheduleTime';

  @ApiPropertyOptional({
    example: 'desc',
    enum: ['asc', 'desc'],
    description: 'Sorting direction order: asc or desc',
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
    description: 'Number of results to retrieve per page',
    default: 10,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  limit?: number = 10;
}
