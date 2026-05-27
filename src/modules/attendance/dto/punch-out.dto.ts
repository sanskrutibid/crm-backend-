import { ApiProperty } from '@nestjs/swagger';
import { IsLatitude, IsLongitude, IsNotEmpty, IsNumber } from 'class-validator';

/**
 * Validates parameters needed for finalizing and closing agent shifts.
 */
export class PunchOutDto {
  @ApiProperty({ example: 28.5410, description: 'GPS latitude coordinate at shift punch-out' })
  @IsNumber()
  @IsLatitude({ message: 'Invalid latitude coordinate' })
  @IsNotEmpty({ message: 'Latitude is required' })
  latitude: number;

  @ApiProperty({ example: 77.4020, description: 'GPS longitude coordinate at shift punch-out' })
  @IsNumber()
  @IsLongitude({ message: 'Invalid longitude coordinate' })
  @IsNotEmpty({ message: 'Longitude is required' })
  longitude: number;
}
