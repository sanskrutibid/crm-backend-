import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class CreateSourceDto {
  @ApiProperty({
    description: 'Name of the lead source (e.g. Facebook, Google Ads, Website, Referral)',
    example: 'Google Ads',
    required: false,
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    description: 'Alias for source name',
    example: 'Google Ads',
  })
  @IsOptional()
  @IsString()
  sourceName?: string;

  @ApiPropertyOptional({
    description: 'Alias for source',
    example: 'Google Ads',
  })
  @IsOptional()
  @IsString()
  source?: string;

  @ApiPropertyOptional({
    description: 'Alias for snake_case source name',
    example: 'Google Ads',
  })
  @IsOptional()
  @IsString()
  source_name?: string;

  @ApiPropertyOptional({
    description: 'Alias for lowercase sourcename',
    example: 'Google Ads',
  })
  @IsOptional()
  @IsString()
  sourcename?: string;

  @ApiPropertyOptional({
    description: 'Optional active status flag',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}


