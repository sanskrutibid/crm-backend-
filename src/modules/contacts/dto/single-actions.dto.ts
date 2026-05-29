import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class ChangeStatusDto {
  @ApiProperty({
    example: 'Active',
    description: 'New status classification for the contact (e.g. Active, Inactive, Pending Contact, DND, etc.)',
  })
  @IsString()
  status: string;

  @ApiPropertyOptional({
    example: 'Client confirmed structural requirements during row villa review.',
    description: 'Status update remark/comment explaining the rationale behind change.',
  })
  @IsString()
  @IsOptional()
  remark?: string;
}

export class SendSmsSingleDto {
  @ApiProperty({
    example: 'Festival Template',
    description: 'Name of the template from SMS templates list.',
  })
  @IsString()
  template: string;

  @ApiProperty({
    example: '123456789012345678',
    description: 'DLT Template ID approved in registry.',
  })
  @IsString()
  dltTemplateId: string;

  @ApiProperty({
    example: 'Dear Client, happy holidays from Phise Infotech!',
    description: 'Raw text message body (max 165 characters).',
  })
  @IsString()
  message: string;

  @ApiProperty({
    example: '2026-05-29',
    description: 'Scheduled execution date (YYYY-MM-DD format).',
  })
  @IsString()
  scheduleDate: string;

  @ApiProperty({
    example: '12:47pm',
    description: 'Scheduled execution time (e.g. 12:47pm).',
  })
  @IsString()
  scheduleTime: string;
}

export class SendEmailSingleDto {
  @ApiProperty({
    example: 'Premium Greeting Template',
    description: 'Template selected for sending email.',
  })
  @IsString()
  template: string;

  @ApiProperty({
    example: 'dayamati.chirawali@gmail.com',
    description: 'Main recipient email address.',
  })
  @IsString()
  to: string;

  @ApiPropertyOptional({
    example: 'cc@phise.in',
    description: 'Carbon copy recipient email address.',
  })
  @IsString()
  @IsOptional()
  cc?: string;

  @ApiPropertyOptional({
    example: 'bcc@phise.in',
    description: 'Blind carbon copy recipient email address.',
  })
  @IsString()
  @IsOptional()
  bcc?: string;

  @ApiProperty({
    example: 'Holiday Greetings from CRM',
    description: 'Subject of the email.',
  })
  @IsString()
  subject: string;

  @ApiProperty({
    example: '<p>Dear Client, we wish you a fantastic week ahead!</p>',
    description: 'Rich text/HTML email message body.',
  })
  @IsString()
  message: string;

  @ApiProperty({
    example: '2026-05-29',
    description: 'Execution date scheduled for sending.',
  })
  @IsString()
  scheduleDate: string;

  @ApiProperty({
    example: '12:47pm',
    description: 'Execution time scheduled for sending.',
  })
  @IsString()
  scheduleTime: string;
}

export class QuickNoteDto {
  @ApiProperty({
    example: 'Call Summary',
    description: 'Category/type of quick note comment (e.g. Call Summary, Site Visit, Meeting Minutes).',
  })
  @IsString()
  commentType: string;

  @ApiProperty({
    example: 'Client requested flat structural plans via email next Monday.',
    description: 'Raw text remark details.',
  })
  @IsString()
  comment: string;
}

export class TransferContactDto {
  @ApiProperty({
    example: '60d5ecb8b394142e88a38c21',
    description: 'Mongoose ObjectId of the new User (Agent/Employee) to transfer contact assignee ownership to.',
  })
  @IsString()
  assignedTo: string;

  @ApiProperty({
    example: 'Cold Calling Transfer',
    enum: ['Customer Transfer', 'Cold Calling Transfer'],
    description: 'The type of transfer action being performed.',
  })
  @IsString()
  transferType: string;

  @ApiPropertyOptional({
    example: 'Dhantoli Premium Folder',
    description: 'The folder to assign the contact to post-transfer.',
  })
  @IsString()
  @IsOptional()
  folder?: string;

  @ApiPropertyOptional({
    example: 'Global Team',
    description: 'The branch to reassign the contact to.',
  })
  @IsString()
  @IsOptional()
  branch?: string;

  @ApiPropertyOptional({
    example: 'Private',
    description: 'Visibility or access permissions to apply.',
  })
  @IsString()
  @IsOptional()
  permission?: string;

  @ApiProperty({
    example: true,
    description: 'Send WhatsApp notification to the newly assigned agent.',
  })
  @IsBoolean()
  sendWhatsappToAssignee: boolean;

  @ApiProperty({
    example: false,
    description: 'Send WhatsApp notification to the customer/contact.',
  })
  @IsBoolean()
  sendWhatsappToCustomer: boolean;

  @ApiProperty({
    example: true,
    description: 'Send email notification to the newly assigned agent.',
  })
  @IsBoolean()
  sendEmailToAssignee: boolean;

  @ApiProperty({
    example: false,
    description: 'Send email notification to the customer/contact.',
  })
  @IsBoolean()
  sendEmailToCustomer: boolean;

  @ApiProperty({
    example: true,
    description: 'Stay on the page after the transfer form is submitted.',
  })
  @IsBoolean()
  stayOnPage: boolean;

  @ApiPropertyOptional({
    example: 'Transferred due to shift realignment.',
    description: 'Transfer remark/comment for timeline context.',
  })
  @IsString()
  @IsOptional()
  comment?: string;
}

export class AttachDocumentDto {
  @ApiProperty({
    example: 'General',
    description: 'Type/category of the document (e.g. General, Invoice, Contract).',
  })
  @IsString()
  type: string;

  @ApiProperty({
    example: 'Aadhaar Card Copy.pdf',
    description: 'Name or description of the document.',
  })
  @IsString()
  name: string;

  @ApiProperty({
    example: 'Global Team',
    description: 'The branch associated with the document upload.',
  })
  @IsString()
  branch: string;

  @ApiProperty({
    example: 'Admin User',
    description: 'The assignee/uploader name or user association.',
  })
  @IsString()
  assignee: string;

  @ApiPropertyOptional({
    example: true,
    description: 'Whether the document is public or internal-only.',
  })
  @IsBoolean()
  @IsOptional()
  isPublic?: boolean;
}

export class TermsConditionsDto {
  @ApiProperty({
    example: 'Terms and Conditions of Service Engagement',
    description: 'Subject line of the terms email.',
  })
  @IsString()
  subject: string;

  @ApiProperty({
    example: '<p>Dear Customer, please view our standard terms and conditions details below...</p>',
    description: 'Rich text/HTML email message body containing terms and conditions.',
  })
  @IsString()
  message: string;
}
