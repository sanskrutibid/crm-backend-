import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsOptional, IsString, IsArray, IsNumber, Min, Max } from 'class-validator';
import { LeadStatus, LeadVisibility } from '../schemas/lead.schema';

export class ChangeLeadStatusDto {
  @ApiProperty({
    example: LeadStatus.WON,
    enum: LeadStatus,
    description: 'New lifecycle status for the lead (In Progress, Won, Lost)',
  })
  @IsEnum(LeadStatus)
  status: LeadStatus;

  @ApiProperty({
    example:
      'Client agreed to proceed with row villa purchase at Rs. 1.35 Crore.',
    description:
      'Final outcome remark detail explaining the status update context.',
  })
  @IsString()
  outcome: string;
}

export class UpdateRequirementDto {
  @ApiProperty({
    example:
      'Rs. 1.38 Crore, 3 Bed, for Sale in Riddhi Siddhi, Pande Layout, Nagpur',
    description: 'Modified raw text customer basic requirements description',
  })
  @IsString()
  requirement: string;
}

export class SendLeadSmsDto {
  @ApiProperty({
    example: 'Follow-up Template',
    description: 'SMS Template name classification',
  })
  @IsString()
  template: string;

  @ApiProperty({
    example: '123456789012345678',
    description: 'Approved DLT Template ID',
  })
  @IsString()
  dltTemplateId: string;

  @ApiProperty({
    example: 'Dear customer, happy holidays from Vaultstone CRM!',
    description: 'Raw text message body (max 165 characters)',
  })
  @IsString()
  message: string;

  @ApiProperty({
    example: '2026-05-29',
    description: 'Scheduled execution date (YYYY-MM-DD)',
  })
  @IsString()
  scheduleDate: string;

  @ApiProperty({
    example: '2:51pm',
    description: 'Scheduled execution time',
  })
  @IsString()
  scheduleTime: string;
}

export class SendLeadEmailDto {
  @ApiProperty({
    example: 'Proposal Template',
    description: 'Email Template name classification',
  })
  @IsString()
  template: string;

  @ApiProperty({
    example: 'chirag.ashtankar@gmail.com',
    description: 'Target recipient email address',
  })
  @IsString()
  to: string;

  @ApiPropertyOptional({
    example: 'cc@vaultstone.in',
    description: 'Carbon copy recipient email address',
  })
  @IsString()
  @IsOptional()
  cc?: string;

  @ApiPropertyOptional({
    example: 'bcc@vaultstone.in',
    description: 'Blind carbon copy recipient email address',
  })
  @IsString()
  @IsOptional()
  bcc?: string;

  @ApiProperty({
    example: 'Proposal details for Greenwood Residency flat selection',
    description: 'Subject line of the email',
  })
  @IsString()
  subject: string;

  @ApiProperty({
    example:
      '<p>Dear customer, please find the proposal document details...</p>',
    description: 'HTML rich text email message body',
  })
  @IsString()
  message: string;

  @ApiProperty({
    example: '2026-05-29',
    description: 'Scheduled execution date (YYYY-MM-DD)',
  })
  @IsString()
  scheduleDate: string;

  @ApiProperty({
    example: '2:51pm',
    description: 'Scheduled execution time',
  })
  @IsString()
  scheduleTime: string;
}

export class LeadQuickNoteDto {
  @ApiProperty({
    example: 'Call Summary',
    description:
      'Category/type of quick note comment (e.g. Call Summary, Site Visit, Meeting Minutes).',
  })
  @IsString()
  commentType: string;

  @ApiProperty({
    example: 'Client requested flat structural plans next Monday.',
    description: 'Raw text note remark details',
  })
  @IsString()
  comment: string;
}

export class SendProposalDto {
  @ApiProperty({ example: 'English', description: 'Communication language' })
  @IsString()
  language: string;

  @ApiProperty({ example: 'Property', description: 'Associated CRM module' })
  @IsString()
  module: string;

  @ApiProperty({
    example: 'Solitaire Residency',
    description: 'Target Project Property',
  })
  @IsString()
  propertyProject: string;

  @ApiProperty({
    example: 'Standard Proposal Template',
    description: 'Quotation Proposal Template',
  })
  @IsString()
  template: string;
}

export class LeadTermsConditionsDto {
  @ApiProperty({
    example: 'Terms and Conditions of Service Engagement',
    description: 'Subject line of the terms email',
  })
  @IsString()
  subject: string;

  @ApiProperty({
    example:
      '<p>Dear Customer, please view our standard terms and conditions details below...</p>',
    description:
      'Rich text/HTML email message body containing terms and conditions',
  })
  @IsString()
  message: string;
}

export class CreateSiteVisitDto {
  @ApiProperty({
    example: 'Chirag Ashtankar',
    description: 'Visitor full name',
  })
  @IsString()
  visitor: string;

  @ApiProperty({
    example: 'First Visit',
    description: 'Type of visit (e.g. First Visit, Re-visit)',
  })
  @IsString()
  visitType: string;

  @ApiProperty({
    example: 'Lead',
    description: 'Target CRM module (e.g. Lead, Contact)',
  })
  @IsString()
  module: string;

  @ApiProperty({
    example: 'Solitaire Residency',
    description: 'Target property site name selected',
  })
  @IsString()
  siteName: string;

  @ApiPropertyOptional({
    example: 'Phase 2 Block B',
    description: 'Alternative or custom name description',
  })
  @IsString()
  @IsOptional()
  otherName?: string;

  @ApiProperty({ example: '29-May-2026', description: 'Scheduled visit date' })
  @IsString()
  visitDate: string;

  @ApiProperty({ example: '2:59pm', description: 'Arrival schedule time' })
  @IsString()
  timeIn: string;

  @ApiProperty({ example: '4:30pm', description: 'Departure schedule time' })
  @IsString()
  timeOut: string;

  @ApiPropertyOptional({
    example: 'Highly interested in the 3BHK penthouse configuration.',
    description: 'Visit remark details',
  })
  @IsString()
  @IsOptional()
  remark?: string;

  // Step 2 Internal Information
  @ApiProperty({
    example: 'Gourav Raut',
    description: 'Site Manager full name',
  })
  @IsString()
  siteManager: string;

  @ApiPropertyOptional({
    example: 'Sourcing Associate',
    description: 'Sourcing Manager name',
  })
  @IsString()
  @IsOptional()
  sourcingManager?: string;

  @ApiPropertyOptional({
    example: 'Closing Specialist',
    description: 'Closing Manager name',
  })
  @IsString()
  @IsOptional()
  closingManager?: string;

  @ApiProperty({ example: 'Website Form', description: 'Discovery source' })
  @IsString()
  source: string;

  @ApiProperty({ example: 'Global Team', description: 'Assigned CRM Branch' })
  @IsString()
  branch: string;

  @ApiProperty({
    example: 'Gourav Raut',
    description: 'Assigned CRM executive agent',
  })
  @IsString()
  assignee: string;

  @ApiProperty({
    example: 'Scheduled',
    description: 'Lifecycle status of visit',
  })
  @IsString()
  visitStatus: string;

  @ApiPropertyOptional({
    example: false,
    description: 'Send confirmation SMS alert notification',
  })
  @IsBoolean()
  @IsOptional()
  sendSmsNotification?: boolean;

  @ApiPropertyOptional({
    example: true,
    description: 'Send confirmation Email alert notification',
  })
  @IsBoolean()
  @IsOptional()
  sendEmailNotification?: boolean;

  @ApiPropertyOptional({
    example: 'Private',
    description: 'Visibility scope permissions',
  })
  @IsString()
  @IsOptional()
  visibility?: string;

  @ApiPropertyOptional({
    example: 'https://cdn.vaultstone.com/uploads/photo.jpg',
    description: 'Upload path URL path',
  })
  @IsString()
  @IsOptional()
  photograph?: string;
}

export class ConvertContactsToLeadsDto {
  @ApiProperty({
    example: ['60d5ed7ab394142e88a38c29'],
    description: 'Array of Contact IDs to convert to leads',
  })
  @IsArray()
  contactIds: string[];

  @ApiProperty({
    example: 'Rs. 1.38 Crore, 3 Bed, for Sale in Riddhi Siddhi, Pande Layout',
    description: 'Basic requirements description for the leads',
  })
  @IsString()
  requirement: string;

  @ApiPropertyOptional({
    example: 'Duplex',
    description: 'Interested in property type/specifications',
  })
  @IsString()
  @IsOptional()
  interestedIn?: string;

  @ApiProperty({
    example: '26-May-2026',
    description: 'Followup scheduled date',
  })
  @IsString()
  scheduleDate: string;

  @ApiProperty({
    example: '4:34pm',
    description: 'Followup scheduled time',
  })
  @IsString()
  scheduleTime: string;

  @ApiPropertyOptional({
    example: 'Select',
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
  source: string;

  @ApiProperty({
    example: 'Global Team',
    description: 'Assigned office branch location name',
  })
  @IsString()
  branch: string;

  @ApiPropertyOptional({
    example: '60d5ecb8b394142e88a38c21',
    description: 'Assigned agent user ID',
  })
  @IsString()
  @IsOptional()
  assignedTo?: string;

  @ApiPropertyOptional({
    example: 50,
    description: 'Lead score percentage (0-100)',
    default: 50,
  })
  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  score?: number;

  @ApiPropertyOptional({
    example: false,
    description: 'Send alert SMS/WhatsApp message to assignee agent',
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  sendWhatsAppToAssignee?: boolean;

  @ApiPropertyOptional({
    example: false,
    description: 'Send alert Email message to assignee agent',
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  sendEmailToAssignee?: boolean;

  @ApiPropertyOptional({
    example: false,
    description: 'Send confirmation SMS/WhatsApp message to customer',
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  sendWhatsAppToCustomer?: boolean;

  @ApiPropertyOptional({
    example: false,
    description: 'Send confirmation Email message to customer',
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
}
