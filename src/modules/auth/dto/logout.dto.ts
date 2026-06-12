import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional } from 'class-validator';

export class LogoutDto {
  @ApiProperty({
    example: 28.6139,
    description: 'Latitude of the logout location',
    required: false,
  })
  @IsOptional()
  @IsNumber({}, { message: 'Latitude must be a number' })
  lat?: number;

  @ApiProperty({
    example: 77.209,
    description: 'Longitude of the logout location',
    required: false,
  })
  @IsOptional()
  @IsNumber({}, { message: 'Longitude must be a number' })
  long?: number;
}
