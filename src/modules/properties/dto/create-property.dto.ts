import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { PropertyStatus } from '../schemas/property.schema';

export class CreatePropertyDto {
  @ApiProperty({
    example: 'Greenwood Luxury Residency',
    description: 'Name of the real-estate property project',
  })
  @IsString()
  @IsNotEmpty({ message: 'Property name is required' })
  name: string;

  @ApiProperty({
    example: 'Bandra West, Mumbai',
    description: 'Geographical location/address of the property',
  })
  @IsString()
  @IsNotEmpty({ message: 'Location is required' })
  location: string;

  @ApiProperty({
    example: '3 BHK Premium Apartment',
    description: 'Configuration or description of unit layout type',
  })
  @IsString()
  @IsNotEmpty({ message: 'Property type is required' })
  type: string;

  @ApiProperty({
    example: '₹2.75 Cr',
    description: 'Price display value (e.g., in rupees or crores)',
  })
  @IsString()
  @IsNotEmpty({ message: 'Price is required' })
  price: string;

  @ApiProperty({
    example: 1850,
    description: 'Total build-up size of property unit in square feet',
  })
  @IsNumber()
  @Min(1, { message: 'Sqft must be at least 1' })
  sqft: number;

  @ApiPropertyOptional({
    example: PropertyStatus.AVAILABLE,
    enum: PropertyStatus,
    description: 'Current sales availability status of listings',
    default: PropertyStatus.AVAILABLE,
  })
  @IsEnum(PropertyStatus, { message: 'Invalid property status' })
  @IsOptional()
  status?: PropertyStatus;

  @ApiProperty({
    example: 'Greenwood Infra Corp',
    description: 'Builder or Developer company branding name',
  })
  @IsString()
  @IsNotEmpty({ message: 'Builder name is required' })
  builder: string;
}
