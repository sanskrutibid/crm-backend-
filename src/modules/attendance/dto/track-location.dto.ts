import { ApiProperty } from '@nestjs/swagger';
import { IsLatitude, IsLongitude, IsNotEmpty, IsNumber } from 'class-validator';

/**
 * Validates periodic GPS updates pushed from the agent's mobile device during an active shift.
 */
export class TrackLocationDto {
  @ApiProperty({ example: 28.5370, description: 'Periodic GPS latitude snapshot' })
  @IsNumber()
  @IsLatitude({ message: 'Invalid latitude coordinate' })
  @IsNotEmpty({ message: 'Latitude is required' })
  latitude: number;

  @ApiProperty({ example: 77.3950, description: 'Periodic GPS longitude snapshot' })
  @IsNumber()
  @IsLongitude({ message: 'Invalid longitude coordinate' })
  @IsNotEmpty({ message: 'Longitude is required' })
  longitude: number;
}
