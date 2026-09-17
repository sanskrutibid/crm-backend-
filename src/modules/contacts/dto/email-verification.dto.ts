import { IsEmail, IsNotEmpty, IsString, Length, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SendEmailOtpDto {
  @ApiProperty({ example: 'user@example.com', description: 'Email address to send OTP' })
  @IsEmail({}, { message: 'Please enter a valid email address' })
  @IsNotEmpty({ message: 'Email address is required' })
  email: string;
}

export class VerifyEmailOtpDto {
  @ApiProperty({ example: 'user@example.com', description: 'Email address to verify' })
  @IsEmail({}, { message: 'Please enter a valid email address' })
  @IsNotEmpty({ message: 'Email address is required' })
  email: string;

  @ApiProperty({ example: '123456', description: '6-digit OTP' })
  @IsString()
  @IsNotEmpty({ message: 'OTP is required' })
  @Length(6, 6, { message: 'OTP must be exactly 6 digits' })
  @Matches(/^\d{6}$/, { message: 'OTP must be a 6-digit number' })
  otp: string;
}
