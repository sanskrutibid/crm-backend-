import { IsNotEmpty, IsString, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePropertyTypeDto {
  @ApiProperty({
    description: 'Category of property (e.g. Residential, Commercial, Industrial, Agricultural)',
    example: 'Residential',
  })
  @IsNotEmpty({ message: 'Category is required' })
  @IsString()
  category: string;

  @ApiProperty({
    description: 'Sub-category of property (e.g. Flat / Apartment, Villa, Office Space, Showroom)',
    example: 'Flat / Apartment',
  })
  @IsNotEmpty({ message: 'Sub-category is required' })
  @IsString()
  subCategory: string;

  @ApiProperty({
    description: 'Is this property type active?',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
