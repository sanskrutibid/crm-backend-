import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, MinLength, IsString, IsEnum, IsOptional } from 'class-validator';
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
    example: 'John',
    description: 'Given/First name of the user',
  })
  @IsString()
  @IsNotEmpty({ message: 'First name is required' })
  firstName: string;

  @ApiProperty({
    example: 'Doe',
    description: 'Family/Last name of the user',
  })
  @IsString()
  @IsNotEmpty({ message: 'Last name is required' })
  lastName: string;

  @ApiPropertyOptional({
    example: UserRole.AGENT,
    enum: UserRole,
    description: 'CRM permission level role',
    default: UserRole.AGENT,
  })
  @IsEnum(UserRole, { message: 'Role must be either ADMIN or AGENT' })
  @IsOptional()
  role?: UserRole;
}
