import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsEnum,
  IsBoolean,
  IsOptional,
  IsString,
  IsNumber,
  Min,
  Max,
} from 'class-validator';
import {
  LeadTemperature,
  LeadStatus,
  LeadVisibility,
} from '../schemas/lead.schema';

export class CreateLeadDto {
  // ==========================================
  // 1. Lead Information (Step 1)
  // ==========================================
  @ApiPropertyOptional({
    example: '60d5ed7ab394142e88a38c29',
    description:
      'Target Contact ID registered in the CRM Contacts directory. Required if addNewContact is false/omitted.',
  })
  @IsString()
  @IsOptional()
  contactId?: string;

  @ApiPropertyOptional({
    example: true,
    description:
      'Whether to add a new contact on-the-fly when creating the lead',
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  addNewContact?: boolean;

  @ApiPropertyOptional({
    example: 'Mrs Dayamati Chirawali',
    description: 'Target customer contact name when adding on-the-fly',
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({
    example: '+91 9876543210',
    description: 'Target customer contact mobile when adding on-the-fly',
  })
  @IsString()
  @IsOptional()
  mobile?: string;

  @ApiPropertyOptional({
    example: 'dayamati@gmail.com',
    description: 'Target customer contact email when adding on-the-fly',
  })
  @IsString()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({
    example: 'Chirawali Group LLC',
    description: 'Target customer company name when adding on-the-fly',
  })
  @IsString()
  @IsOptional()
  company?: string;

  @ApiProperty({
    example: 'Rs. 1.38 Crore, 3 Bed, for Sale in Riddhi Siddhi, Pande Layout',
    description: 'Basic requirements entered for the lead',
  })
  @IsString()
  @IsNotEmpty({ message: 'Requirement description is required' })
  requirement: string;

  @ApiProperty({
    example: 'Client seems highly interested, scheduled site visit.',
    description: 'Initial follow-up notes',
  })
  @IsString()
  @IsNotEmpty({ message: 'Followup note is required' })
  followupNote: string;

  @ApiProperty({
    example: '26-May-2026',
    description: 'Followup scheduled date (YYYY-MM-DD or 26-May-2026 format)',
  })
  @IsString()
  @IsNotEmpty({ message: 'Schedule Date is required' })
  scheduleDate: string;

  @ApiProperty({
    example: '4:34pm',
    description: 'Followup scheduled time',
  })
  @IsString()
  @IsNotEmpty({ message: 'Schedule Time is required' })
  scheduleTime: string;

  @ApiPropertyOptional({
    example: 4.5,
    description: 'Lead requirement score ratio',
    default: 1.0,
  })
  @IsNumber()
  @Min(1.0)
  @Max(5.0)
  @IsOptional()
  score?: number;

  // ==========================================
  // 2. Save and Publish Settings (Step 2)
  // ==========================================
  @ApiPropertyOptional({
    example: 'Dhantoli, 172Sqft flat 2cr',
    description: 'Tags/Keywords describing target property specifications',
  })
  @IsString()
  @IsOptional()
  keywords?: string;

  @ApiPropertyOptional({
    example: 'Premium Leads Folder',
    description: 'Target CRM lead storage folder name',
  })
  @IsString()
  @IsOptional()
  folder?: string;

  @ApiProperty({
    example: 'Website Form',
    description: 'Discovery lead channel source',
  })
  @IsString()
  @IsNotEmpty({ message: 'Lead source is required' })
  source: string;

  @ApiProperty({
    example: 'Global Team',
    description: 'Assigned CRM office branch location name',
  })
  @IsString()
  @IsNotEmpty({ message: 'Office branch is required' })
  branch: string;

  @ApiPropertyOptional({
    example: '60d5ecb8b394142e88a38c21',
    description: 'Assigned executive User ID. Defaults to the requesting user.',
  })
  @IsString()
  @IsOptional()
  assignedTo?: string;

  @ApiPropertyOptional({
    example: false,
    description: 'Send alert WhatsApp message to assignee executive',
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  sendWhatsAppToAssignee?: boolean;

  @ApiPropertyOptional({
    example: false,
    description: 'Send alert Email message to assignee executive',
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  sendEmailToAssignee?: boolean;

  @ApiPropertyOptional({
    example: false,
    description: 'Send confirmation WhatsApp message to customer contact',
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  sendWhatsAppToCustomer?: boolean;

  @ApiPropertyOptional({
    example: false,
    description: 'Send confirmation Email message to customer contact',
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  sendEmailToCustomer?: boolean;

  @ApiPropertyOptional({
    example: LeadVisibility.PRIVATE,
    enum: LeadVisibility,
    description: 'Visibility scope permissions',
    default: LeadVisibility.PRIVATE,
  })
  @IsEnum(LeadVisibility)
  @IsOptional()
  visibility?: LeadVisibility;

  @ApiPropertyOptional({
    example: false,
    description: 'Confirms terms and conditions have been shared',
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  termsShared?: boolean;

  // ==========================================
  // 3. Status Badges & Follow-up Details
  // ==========================================
  @ApiPropertyOptional({
    example: LeadTemperature.COLD,
    enum: LeadTemperature,
    description: 'Urgency tier temperature badge classification',
    default: LeadTemperature.COLD,
  })
  @IsEnum(LeadTemperature)
  @IsOptional()
  temperature?: LeadTemperature;

  @ApiPropertyOptional({
    example: LeadStatus.IN_PROGRESS,
    enum: LeadStatus,
    description: 'Lifecycle follow-up execution status',
    default: LeadStatus.IN_PROGRESS,
  })
  @IsEnum(LeadStatus)
  @IsOptional()
  status?: LeadStatus;

  @ApiPropertyOptional({
    example: 'no response',
    description: 'Next follow-up operational remark',
    default: 'no response',
  })
  @IsString()
  @IsOptional()
  nextRemark?: string;

  @ApiPropertyOptional({
    example: 'Said Not Looking Any Property Now',
    description: 'Follow-up outcome remarks',
  })
  @IsString()
  @IsOptional()
  outcome?: string;

  @ApiPropertyOptional({
    example: 'Rs. 1.38 Crore, 3 Bed, for Sale in Riddhi Siddhi, Pande Layout',
    description: 'Target interested property description',
  })
  @IsString()
  @IsOptional()
  interestedIn?: string;

  @ApiPropertyOptional({
    example: 'Follow-Up Scheduled',
    description: 'Schedule execution purpose classification',
    default: 'Follow-Up Scheduled',
  })
  @IsString()
  @IsOptional()
  purpose?: string;
}
