import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  MinLength,
  IsOptional,
  IsNumber,
} from 'class-validator';

export class LoginDto {
  @ApiProperty({
    example: 'admin@crmapp.com',
    description: 'Registered email address of the CRM user',
  })
  @IsEmail({}, { message: 'Please enter a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;

  @ApiProperty({
    example: 'AdminPass123!',
    description: 'Secure account password',
    minLength: 6,
  })
  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(6, { message: 'Password must be at least 6 characters' })
  password: string;

  @ApiProperty({
    example: 28.6139,
    description: 'Latitude of the login location',
    required: false,
  })
  @IsOptional()
  @IsNumber({}, { message: 'Latitude must be a number' })
  lat?: number;

  @ApiProperty({
    example: 77.209,
    description: 'Longitude of the login location',
    required: false,
  })
  @IsOptional()
  @IsNumber({}, { message: 'Longitude must be a number' })
  long?: number;
}
