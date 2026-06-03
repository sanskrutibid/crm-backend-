import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryTemplateDto {
  @ApiPropertyOptional({
    example: 'Onboarding',
    description: 'Search string matching template name or templateId',
  })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({
    example: 'Onboarding',
    description: 'Search keyword matching template name or templateId (alias for search)',
  })
  @IsString()
  @IsOptional()
  keyword?: string;

  @ApiPropertyOptional({
    example: 'Email',
    description: 'Filter by template type (e.g. Email, SMS, WhatsApp)',
  })
  @IsString()
  @IsOptional()
  templateType?: string;

  @ApiPropertyOptional({
    example: 'editor',
    description: 'Filter by layout type (editor, file, url)',
  })
  @IsString()
  @IsOptional()
  layoutType?: string;

  @ApiPropertyOptional({
    example: 'createdAt',
    description: 'Field name to sort results by (e.g. createdAt, name, templateType)',
    default: 'createdAt',
  })
  @IsString()
  @IsOptional()
  sortBy?: string = 'createdAt';

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
