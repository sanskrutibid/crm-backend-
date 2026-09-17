import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryLoginHistoryDto {
  @ApiPropertyOptional({
    example: '60d5ecb8b394142e88a38c21',
    description: 'Filter by user ID (Only applicable for ADMIN)',
  })
  @IsString()
  @IsOptional()
  userId?: string;

  @ApiPropertyOptional({
    example: 'login',
    enum: ['login', 'logout'],
    description: "Filter by type: 'login' or 'logout'",
  })
  @IsEnum(['login', 'logout'], { message: "Type must be 'login' or 'logout'" })
  @IsOptional()
  type?: 'login' | 'logout';

  @ApiPropertyOptional({
    example: 'timestamp',
    description: "Field name to sort by: 'timestamp', 'ip', etc.",
    default: 'timestamp',
  })
  @IsString()
  @IsOptional()
  sortBy?: string = 'timestamp';

  @ApiPropertyOptional({
    example: 'desc',
    enum: ['asc', 'desc'],
    description: 'Sorting direction: asc or desc.',
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
    description: 'Number of results to retrieve per page.',
    default: 10,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  limit?: number = 10;
}
