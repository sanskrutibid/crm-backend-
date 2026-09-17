import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateReportDto {
  @ApiProperty({
    example: 'Monthly CRM Productivity Report',
    description: 'Name of the report',
  })
  @IsString()
  @IsNotEmpty({ message: 'Name is required' })
  name: string;

  @ApiPropertyOptional({
    example:
      'Monthly CRM Productivity Report provides an employee-wise snapshot of leads, follow-ups, calls, site visits, and lead sources.',
    description: 'Detailed description of the report',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    example: 'admin',
    description: 'Required permissions to view this report',
  })
  @IsString()
  @IsOptional()
  permission?: string;

  @ApiProperty({
    example: 'Adhoc Report',
    description:
      'Report type classification (e.g. Adhoc Report, Daily Report, Weekly Report, Monthly Report)',
    default: 'Adhoc Report',
  })
  @IsString()
  @IsNotEmpty({ message: 'Type is required' })
  type: string;

  @ApiPropertyOptional({
    example: 'Active',
    description: 'Validity status of the report (e.g. Active, Inactive)',
    default: 'Active',
  })
  @IsString()
  @IsOptional()
  validity?: string;

  @ApiPropertyOptional({
    example: 'On Demand',
    description:
      'Timing scheduled for the next run (e.g. On Demand or 01 Jul 2025 6:00 PM)',
    default: 'On Demand',
  })
  @IsString()
  @IsOptional()
  nextRun?: string;
}
