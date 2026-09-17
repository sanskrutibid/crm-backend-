import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsEnum, IsOptional, IsString } from 'class-validator';
import { DNDStatus } from '../schemas/contact.schema';
import { AudienceType, ScheduleType } from '../schemas/audience.schema';

export class CreateAudienceDto {
  @ApiProperty({ example: 'Bandra VIP Clients' })
  @IsString()
  name: string;

  @ApiProperty({ example: AudienceType.EMAIL, enum: AudienceType })
  @IsEnum(AudienceType, {
    message: 'Invalid audience type. Options: Email, SMS, IVR, WhatsApp',
  })
  type: AudienceType;

  @ApiProperty({ example: 'Festival Greeting Template' })
  @IsString()
  template: string;

  @ApiPropertyOptional({ example: 'OFFER-2026' })
  @IsString()
  @IsOptional()
  templateId?: string;

  @ApiProperty({ example: ScheduleType.ON_DEMAND, enum: ScheduleType })
  @IsEnum(ScheduleType, {
    message:
      'Invalid schedule type. Options: On Demand, Daily, Weekly, Monthly',
  })
  schedule: ScheduleType;

  @ApiPropertyOptional({ example: '11:57am' })
  @IsString()
  @IsOptional()
  time?: string;

  @ApiPropertyOptional({ example: '11:57am' })
  @IsString()
  @IsOptional()
  scheduleTime?: string;

  @ApiPropertyOptional({ example: '25-Mar-2027' })
  @IsString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({ example: '2026-06-15' })
  @IsString()
  @IsOptional()
  scheduleDate?: string;

  @ApiPropertyOptional({ type: [String], example: ['Monday', 'Wednesday'] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  setWeeks?: string[];

  @ApiPropertyOptional({ type: [Number], example: [1, 15, 30] })
  @IsArray()
  @IsOptional()
  setDays?: number[];

  @ApiPropertyOptional({ type: [String] })
  @IsArray()
  @IsOptional()
  contactIds?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  filters?: any;
}

export class SendSmsDto {
  @ApiProperty({ example: 'Festival Template' })
  @IsString()
  template: string;

  @ApiProperty({ example: '123456789012345678' })
  @IsString()
  dltTemplateId: string;

  @ApiProperty({ example: 'Hello, check out our new listing!' })
  @IsString()
  message: string;

  @ApiProperty({ example: '2026-05-29' })
  @IsString()
  scheduleDate: string;

  @ApiProperty({ example: '11:49am' })
  @IsString()
  scheduleTime: string;

  @ApiPropertyOptional({ type: [String] })
  @IsArray()
  @IsOptional()
  contactIds?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  filters?: any;

  @ApiPropertyOptional({ example: 'On Demand' })
  @IsString()
  @IsOptional()
  schedule?: string;

  @ApiPropertyOptional({ type: [String], example: ['Monday', 'Tuesday'] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  setWeeks?: string[];

  @ApiPropertyOptional({ type: [Number], example: [1, 15] })
  @IsArray()
  @IsOptional()
  setDays?: number[];
}

export class SendEmailDto {
  @ApiProperty({ example: 'Premium Template' })
  @IsString()
  template: string;

  @ApiProperty({ example: 'Exciting New Offers!' })
  @IsString()
  subject: string;

  @ApiProperty({ example: '<p>Hello, check out this content</p>' })
  @IsString()
  message: string;

  @ApiProperty({ example: '2026-05-29' })
  @IsString()
  scheduleDate: string;

  @ApiProperty({ example: '11:50am' })
  @IsString()
  scheduleTime: string;

  @ApiPropertyOptional({ type: [String] })
  @IsArray()
  @IsOptional()
  contactIds?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  filters?: any;
}

export class GroupDeleteDto {
  @ApiPropertyOptional({ type: [String] })
  @IsArray()
  @IsOptional()
  contactIds?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  filters?: any;
}

export class MarkDndDto {
  @ApiProperty({ enum: DNDStatus })
  @IsEnum(DNDStatus)
  dndStatus: DNDStatus;

  @ApiPropertyOptional({ type: [String] })
  @IsArray()
  @IsOptional()
  contactIds?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  filters?: any;
}

export class VerifyEmailsDto {
  @ApiPropertyOptional({ type: [String] })
  @IsArray()
  @IsOptional()
  contactIds?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  filters?: any;
}

export class MergeContactsDto {
  @ApiProperty({ example: '60d5ecb8b394142e88a38c21' })
  @IsString()
  primaryContactId: string;

  @ApiProperty({ type: [String] })
  @IsArray()
  duplicateContactIds: string[];
}

export class UpdateDndCommaDto {
  @ApiProperty({ example: '+91 9876543031, +91 9876543032' })
  @IsString()
  mobiles: string;
}

export class GroupTransferDto {
  @ApiPropertyOptional({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  contactIds?: string[];

  @ApiProperty({ example: 'Customer Transfer' })
  @IsString()
  transferType: string;

  @ApiPropertyOptional({ example: 'Sales' })
  @IsString()
  @IsOptional()
  folder?: string;

  @ApiPropertyOptional({ example: 'Nagpur' })
  @IsString()
  @IsOptional()
  branch?: string;

  @ApiPropertyOptional({ example: '60d5ecb8b394142e88a38c21' })
  @IsString()
  @IsOptional()
  assignedTo?: string;

  @ApiPropertyOptional({ example: 'Regular' })
  @IsString()
  @IsOptional()
  assignMode?: string; // 'Regular' or 'Random'

  @ApiPropertyOptional({ example: 'Private' })
  @IsString()
  @IsOptional()
  permission?: string;

  @ApiPropertyOptional({ example: 'Bulk transfer comment.' })
  @IsString()
  @IsOptional()
  comment?: string;
}
