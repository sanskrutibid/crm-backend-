import { ApiProperty } from '@nestjs/swagger';
import { IsLatitude, IsLongitude, IsNotEmpty, IsNumber } from 'class-validator';

/**
 * Validates parameters needed for initiating agent punch-in shifts.
 */
export class PunchInDto {
  @ApiProperty({ example: 28.5355, description: 'GPS latitude coordinate at shift punch-in' })
  @IsNumber()
  @IsLatitude({ message: 'Invalid latitude coordinate' })
  @IsNotEmpty({ message: 'Latitude is required' })
  latitude: number;

  @ApiProperty({ example: 77.3910, description: 'GPS longitude coordinate at shift punch-in' })
  @IsNumber()
  @IsLongitude({ message: 'Invalid longitude coordinate' })
  @IsNotEmpty({ message: 'Longitude is required' })
  longitude: number;
}
