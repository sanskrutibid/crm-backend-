import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class ScheduleEmailDto {
  @ApiProperty({
    example: 'customer1@example.com, customer2@example.com',
    description: 'Recipient email address(es). Can be a comma-separated string or an array of emails.',
  })
  @IsNotEmpty({ message: 'Recipient is required' })
  to: string | string[];

  @ApiPropertyOptional({
    example: 'cc1@example.com',
    description: 'CC email address(es). Can be a comma-separated string or an array of emails.',
  })
  @IsOptional()
  cc?: string | string[];

  @ApiPropertyOptional({
    example: 'bcc1@example.com',
    description: 'BCC email address(es). Can be a comma-separated string or an array of emails.',
  })
  @IsOptional()
  bcc?: string | string[];

  @ApiProperty({
    example: 'Welcome to VaultStone CRM!',
    description: 'Subject of the email',
  })
  @IsString()
  @IsNotEmpty({ message: 'Subject is required' })
  subject: string;

  @ApiProperty({
    example: '<h3>Hello!</h3><p>We are glad to have you onboarding.</p>',
    description: 'HTML body content of the email',
  })
  @IsString()
  @IsNotEmpty({ message: 'Email body content is required' })
  body: string;

  @ApiPropertyOptional({
    example: '2026-06-04',
    description: 'Scheduled date to send the email (e.g. YYYY-MM-DD or DD-MMM-YYYY). If empty, today is used.',
  })
  @IsOptional()
  @IsString()
  scheduleDate?: string;

  @ApiPropertyOptional({
    example: '10:52 am',
    description: 'Scheduled time to send the email (e.g. HH:mm or HH:mm am/pm). If empty, immediate sending is attempted.',
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
