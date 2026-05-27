import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsInt, Min } from 'class-validator';
import { ActivityType } from '../schemas/activity.schema';
import { Type } from 'class-transformer';

export class QueryActivityDto {
  @ApiPropertyOptional({
    example: ActivityType.LEAD,
    enum: ActivityType,
    description: 'Filter logs by action category type classification',
  })
  @IsEnum(ActivityType, { message: 'Invalid activity type' })
  @IsOptional()
  type?: ActivityType;

  @ApiPropertyOptional({
    example: 'Booking',
    description: 'Search string matching against description text',
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
    description: 'Number of results to retrieve per page',
    default: 10,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  limit?: number = 10;
}
