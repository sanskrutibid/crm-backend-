import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { PropertyStatus } from '../schemas/property.schema';

export class UpdatePropertyDto {
  @ApiPropertyOptional({
    example: 'Greenwood Luxury Residency',
    description: 'Updated name of the property',
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({
    example: 'Bandra West, Mumbai',
    description: 'Updated location/address of the property',
  })
  @IsString()
  @IsOptional()
  location?: string;

  @ApiPropertyOptional({
    example: '3 BHK Premium Apartment',
    description: 'Updated configuration unit layout type',
  })
  @IsString()
  @IsOptional()
  type?: string;

  @ApiPropertyOptional({
    example: '₹2.80 Cr',
    description: 'Updated price display value',
  })
  @IsString()
  @IsOptional()
  price?: string;

  @ApiPropertyOptional({
    example: 1850,
    description: 'Updated total build-up size in square feet',
  })
  @IsNumber()
  @Min(1, { message: 'Sqft must be at least 1' })
  @IsOptional()
  sqft?: number;

  @ApiPropertyOptional({
    example: PropertyStatus.SOLD_OUT,
    enum: PropertyStatus,
    description: 'Updated sales availability status',
  })
  @IsEnum(PropertyStatus, { message: 'Invalid property status' })
  @IsOptional()
  status?: PropertyStatus;

  @ApiPropertyOptional({
    example: 'Greenwood Infra Corp',
    description: 'Updated builder company name',
  })
  @IsString()
  @IsOptional()
  builder?: string;
}
