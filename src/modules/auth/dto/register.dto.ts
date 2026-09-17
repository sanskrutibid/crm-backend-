import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  MinLength,
  IsString,
  IsEnum,
  IsOptional,
  Equals,
  Matches,
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
    description: 'Account login password (minimum 8 characters with 1 capital, 1 small, 1 number, 1 special char)',
    minLength: 8,
  })
  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+={}\[\]|\\:;"'<>,.?/~`\-]).{8,}$/, {
    message: 'Password must contain at least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character',
  })
  password: string;

  @ApiProperty({
    example: 'SecureAgent123!',
    description: 'Confirm registration password',
    minLength: 8,
  })
  @IsNotEmpty({ message: 'Confirm password is required' })
  @MinLength(8, { message: 'Confirm password must be at least 8 characters' })
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
