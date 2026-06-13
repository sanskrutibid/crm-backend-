import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  MinLength,
  IsString,
  IsEnum,
  IsOptional,
  Equals,
} from 'class-validator';
import { UserRole } from '../../users/schemas/user.schema';

export class RegisterDto {
  @ApiProperty({
    example: 'agent@crmapp.com',
    description: 'Unique email address to register',
  })
  @IsEmail({}, { message: 'Please enter a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;

  @ApiProperty({
    example: 'SecureAgent123!',
    description: 'Account login password (minimum 6 characters)',
    minLength: 6,
  })
  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(6, { message: 'Password must be at least 6 characters' })
  password: string;

  @ApiProperty({
    example: 'SecureAgent123!',
    description: 'Confirm registration password',
    minLength: 6,
  })
  @IsNotEmpty({ message: 'Confirm password is required' })
  @MinLength(6, { message: 'Confirm password must be at least 6 characters' })
  confirmPassword: string;

  @ApiProperty({
    example: 'John Doe',
    description: 'Full name of the user',
  })
  @IsString()
  @IsNotEmpty({ message: 'Name is required' })
  name: string;

  @ApiProperty({
    example: true,
    description: 'Must accept terms and conditions',
  })
  @Equals(true, { message: 'You must accept the terms and conditions' })
  agreeTerms: boolean;

  @ApiPropertyOptional({
    example: 'Agent/Broker',
    description: 'CRM permission level role',
    default: 'Agent/Broker',
  })
  @IsString()
  @IsOptional()
  role?: string;
}
