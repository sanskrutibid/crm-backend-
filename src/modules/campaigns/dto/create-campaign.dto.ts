import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class RecipientFiltersDto {
  @ApiPropertyOptional({ example: 'Customer' })
  @IsString()
  @IsOptional()
  customerType?: string;

  @ApiPropertyOptional({ example: 'Employee' })
  @IsString()
  @IsOptional()
  contactType?: string;

  @ApiPropertyOptional({ example: 'Global Team' })
  @IsString()
  @IsOptional()
  branch?: string;

  @ApiPropertyOptional({ example: '60d5ecb8b394142e88a38c21' })
  @IsString()
  @IsOptional()
  assignedTo?: string;

  @ApiPropertyOptional({ example: '60d5ecb8b394142e88a38c21' })
  @IsString()
  @IsOptional()
  submittedBy?: string;

  @ApiPropertyOptional({ example: '2026-06-01' })
  @IsString()
  @IsOptional()
  createDateFrom?: string;

  @ApiPropertyOptional({ example: '2026-06-03' })
  @IsString()
  @IsOptional()
  createDateTo?: string;

  @ApiPropertyOptional({ example: 'Nagpur' })
  @IsString()
  @IsOptional()
  city?: string;

  @ApiPropertyOptional({ example: 'Dhantoli' })
  @IsString()
  @IsOptional()
  location?: string;

  @ApiPropertyOptional({ example: 'Premium Folder' })
  @IsString()
  @IsOptional()
  folder?: string;

  @ApiPropertyOptional({ example: 'Website' })
  @IsString()
  @IsOptional()
  source?: string;

  @ApiPropertyOptional({ example: 'Pending' })
  @IsString()
  @IsOptional()
  dndOptions?: string;

  @ApiPropertyOptional({ example: 'Regular Search' })
  @IsString()
  @IsOptional()
  searchType?: string;
}

export class CreateCampaignDto {
  @ApiProperty({ example: 'Diwali SMS Campaign' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'SMS Campaign' })
  @IsString()
  type: string;

  @ApiProperty({ example: 'Verification OTP SMS' })
  @IsString()
  template: string;

  @ApiProperty({ example: 'Daily' })
  @IsString()
  schedule: string; // 'On Demand', 'Daily', 'Weekly', 'Monthly'

  @ApiPropertyOptional({ example: '10:30 AM' })
  @IsString()
  @IsOptional()
  time?: string;

  @ApiPropertyOptional({ example: '2026-06-03' })
  @IsString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({ type: [String], example: ['Monday'] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  setWeeks?: string[];

  @ApiPropertyOptional({ type: [Number], example: [15] })
  @IsArray()
  @IsNumber({}, { each: true })
  @IsOptional()
  setDays?: number[];

  @ApiPropertyOptional({ type: RecipientFiltersDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => RecipientFiltersDto)
  recipientFilters?: RecipientFiltersDto;

  @ApiPropertyOptional({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  contactIds?: string[];
}
