import { ApiProperty } from '@nestjs/swagger';

export class SourceResponseDto {
  @ApiProperty({
    example: '65a1234567890abcdef12345',
    description: 'MongoDB unique identifier',
  })
  id: string;

  @ApiProperty({
    example: 1,
    description: 'Auto-incrementing integer identifier (1, 2, 3...)',
  })
  sourceId: number;

  @ApiProperty({
    example: 'Google Ads',
    description: 'Lead source name',
  })
  name: string;

  @ApiProperty({
    example: 'Google Ads',
    description: 'Lead source name alias',
  })
  sourceName: string;

  @ApiProperty({
    example: '2026-08-27T07:15:00.000Z',
    description: 'Creation timestamp',
  })
  createdAt: string;

  @ApiProperty({
    example: '2026-08-27T07:15:00.000Z',
    description: 'Last update timestamp',
  })
  updatedAt: string;
}
