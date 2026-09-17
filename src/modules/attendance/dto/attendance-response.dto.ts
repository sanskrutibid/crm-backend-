import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LocationPointDto {
  @ApiProperty({ example: 28.5355, description: 'GPS latitude coordinate' })
  latitude: number;

  @ApiProperty({ example: 77.391, description: 'GPS longitude coordinate' })
  longitude: number;

  @ApiProperty({
    example: '2026-05-26T14:31:00.000Z',
    description: 'Timestamp coordinate was captured',
  })
  timestamp: string;

  @ApiPropertyOptional({
    example: 'Nagpur, Maharashtra',
    description: 'Resolved street address for the location snapshot',
  })
  address?: string;
}

export class HoldingPointDto {
  @ApiProperty({
    example: 28.5355,
    description: 'Centroid latitude of clustered halt locations',
  })
  latitude: number;

  @ApiProperty({
    example: 77.391,
    description: 'Centroid longitude of clustered halt locations',
  })
  longitude: number;

  @ApiProperty({
    example: '2026-05-26T14:35:00.000Z',
    description: 'Halt entry timestamp',
  })
  startTime: string;

  @ApiProperty({
    example: '2026-05-26T14:42:00.000Z',
    description: 'Halt departure timestamp',
  })
  endTime: string;

  @ApiProperty({
    example: 7.2,
    description: 'Total duration spent at this halt point in minutes',
  })
  durationMinutes: number;

  @ApiProperty({
    example: 'Holding Point Detected (Duration: 7m)',
    description: 'Display name/context',
  })
  label: string;
}

export class AgentMovementTimelineDto {
  @ApiProperty({
    example: '60d5ecb8b394142e88a38c21',
    description: 'Sales agent ID',
  })
  userId: string;

  @ApiProperty({ example: '2026-05-26', description: 'Tracking date' })
  date: string;

  @ApiProperty({ example: 'COMPLETED', enum: ['ACTIVE', 'COMPLETED'] })
  status: string;

  @ApiProperty({ example: '2026-05-26T09:00:00.000Z' })
  punchInTime: string;

  @ApiProperty({ type: LocationPointDto })
  punchInLocation: LocationPointDto;

  @ApiPropertyOptional({ example: '2026-05-26T17:30:00.000Z' })
  punchOutTime?: string;

  @ApiPropertyOptional({ type: LocationPointDto })
  punchOutLocation?: LocationPointDto;

  @ApiProperty({
    type: [LocationPointDto],
    description: 'Chronological raw GPS movement path logs',
  })
  path: LocationPointDto[];

  @ApiProperty({
    type: [HoldingPointDto],
    description: 'Stops or halts detected along the path',
  })
  holdingPoints: HoldingPointDto[];

  @ApiProperty({
    example: 12.4,
    description: 'Total calculated distance traveled in Kilometers',
  })
  totalDistanceKm: number;
}
