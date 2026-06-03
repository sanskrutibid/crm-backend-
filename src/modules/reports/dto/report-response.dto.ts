import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ReportResponseDto {
  @ApiProperty({
    example: '60d5ed7ab394142e88a38c29',
    description: 'Report unique database identifier ID',
  })
  id: string;

  @ApiProperty({
    example: 'Monthly CRM Productivity Report',
    description: 'Name of the report',
  })
  name: string;

  @ApiPropertyOptional({
    example: 'Monthly CRM Productivity Report provides an employee-wise snapshot of leads, follow-ups, calls, site visits, and lead sources.',
    description: 'Detailed description of the report',
  })
  description?: string;

  @ApiPropertyOptional({
    example: 'admin',
    description: 'Required permissions to view this report',
  })
  permission?: string;

  @ApiProperty({
    example: 'Adhoc Report',
    description: 'Report type classification',
  })
  type: string;

  @ApiProperty({
    example: 'Active',
    description: 'Validity status of the report',
  })
  validity: string;

  @ApiProperty({
    example: 'On Demand',
    description: 'Next run time or frequency description',
  })
  nextRun: string;

  @ApiPropertyOptional({
    description: 'User details of report creator',
  })
  createdBy?: any;

  @ApiProperty({
    example: '2026-06-03T12:00:00.000Z',
    description: 'Timestamp when report was registered',
  })
  createdAt: string;

  @ApiProperty({
    example: '2026-06-03T12:00:00.000Z',
    description: 'Timestamp when report was last modified',
  })
  updatedAt: string;
}
