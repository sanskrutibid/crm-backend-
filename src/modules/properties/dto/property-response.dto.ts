import { ApiProperty } from '@nestjs/swagger';
import { PropertyStatus } from '../schemas/property.schema';

export class PropertyResponseDto {
  @ApiProperty({ example: '60d5ed7ab394142e88a38c29', description: 'Property unique database identifier ID' })
  id: string;

  @ApiProperty({ example: 'Greenwood Luxury Residency', description: 'Name of the property project' })
  name: string;

  @ApiProperty({ example: 'Bandra West, Mumbai', description: 'Geographical location' })
  location: string;

  @ApiProperty({ example: '3 BHK Premium Apartment', description: 'Configuration or description of unit layout' })
  type: string;

  @ApiProperty({ example: '₹2.75 Cr', description: 'Price display value' })
  price: string;

  @ApiProperty({ example: 1850, description: 'Total build-up size in square feet' })
  sqft: number;

  @ApiProperty({ example: 'Available', enum: PropertyStatus, description: 'Sales availability status' })
  status: PropertyStatus;

  @ApiProperty({ example: 'Greenwood Infra Corp', description: 'Builder or developer branding name' })
  builder: string;

  @ApiProperty({ example: '2026-05-26T14:04:03.000Z', description: 'Timestamp of project registration' })
  createdAt: string;

  @ApiProperty({ example: '2026-05-26T14:04:03.000Z', description: 'Timestamp of last modification' })
  updatedAt: string;
}
