import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class ScheduleSmsDto {
  @ApiProperty({
    example: '+919999999999, +918888888888',
    description: 'Recipient mobile numbers. Can be a comma-separated string or an array of numbers.',
  })
  @IsNotEmpty({ message: 'Mobiles is required' })
  mobiles: string | string[];

  @ApiProperty({
    example: 'Welcome to VaultStone CRM! We are glad to have you onboarding.',
    description: 'Text content of the SMS',
  })
  @IsString()
  @IsNotEmpty({ message: 'Message content is required' })
  message: string;

  @ApiPropertyOptional({
    example: '1207161728391827361',
    description: 'DLT Approved Template ID (for Indian regulatory compliance)',
  })
  @IsString()
  @IsOptional()
  dltTemplateId?: string;

  @ApiPropertyOptional({
    example: 'Transactional',
    description: 'Sms route (e.g. Promotional, Transactional, OTP)',
  })
  @IsString()
  @IsOptional()
  route?: string;

  @ApiPropertyOptional({
    example: '2026-06-04',
    description: 'Scheduled date to send the SMS (e.g. YYYY-MM-DD or DD-MMM-YYYY). If empty, today is used.',
  })
  @IsOptional()
  @IsString()
  scheduleDate?: string;

  @ApiPropertyOptional({
    example: '11:52 am',
    description: 'Scheduled time to send the SMS (e.g. HH:mm or HH:mm am/pm). If empty, immediate sending is attempted.',
  })
  @IsOptional()
  @IsString()
  scheduleTime?: string;

  @ApiPropertyOptional({
    example: '60d5ecb8b394142e88a38c21',
    description: 'User MongoDB ID of creator',
  })
  @IsString()
  @IsOptional()
  createdBy?: string;
}
