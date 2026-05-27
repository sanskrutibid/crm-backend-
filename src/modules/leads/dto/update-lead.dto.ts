import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsBoolean, IsOptional, IsString, IsNumber, Min, Max } from 'class-validator';
import { LeadTemperature, LeadStatus, LeadVisibility } from '../schemas/lead.schema';

export class UpdateLeadDto {
  // ==========================================
  // 1. Lead Information (Step 1)
  // ==========================================
  @ApiPropertyOptional({
    example: '60d5ed7ab394142e88a38c29',
    description: 'Updated Contact ID reference',
  })
  @IsString()
  @IsOptional()
  contactId?: string;

  @ApiPropertyOptional({
    example: 'Rs. 1.38 Crore, 3 Bed, for Sale in Riddhi Siddhi, Pande Layout',
    description: 'Updated basic requirements',
  })
  @IsString()
  @IsOptional()
  requirement?: string;

  @ApiPropertyOptional({
    example: 'Client seems highly interested, scheduled site visit.',
    description: 'Updated followup notes',
  })
  @IsString()
  @IsOptional()
  followupNote?: string;

  @ApiPropertyOptional({
    example: '27-May-2026',
    description: 'Updated followup scheduled date',
  })
  @IsString()
  @IsOptional()
  scheduleDate?: string;

  @ApiPropertyOptional({
    example: '4:30pm',
    description: 'Updated followup scheduled time',
  })
  @IsString()
  @IsOptional()
  scheduleTime?: string;

  @ApiPropertyOptional({
    example: 4.5,
    description: 'Updated lead score',
  })
  @IsNumber()
  @Min(1.00)
  @Max(5.00)
  @IsOptional()
  score?: number;

  // ==========================================
  // 2. Save and Publish Settings (Step 2)
  // ==========================================
  @ApiPropertyOptional({
    example: 'Dhantoli, 172Sqft flat 2cr',
    description: 'Updated Keywords/Tags',
  })
  @IsString()
  @IsOptional()
  keywords?: string;

  @ApiPropertyOptional({
    example: 'Premium Leads Folder',
    description: 'Updated CRM lead folder name',
  })
  @IsString()
  @IsOptional()
  folder?: string;

  @ApiPropertyOptional({
    example: 'Website Form',
    description: 'Updated Discovery source channel',
  })
  @IsString()
  @IsOptional()
  source?: string;

  @ApiPropertyOptional({
    example: 'Global Team',
    description: 'Updated assigned branch',
  })
  @IsString()
  @IsOptional()
  branch?: string;

  @ApiPropertyOptional({
    example: '60d5ecb8b394142e88a38c21',
    description: 'Reassign lead to agent User ID',
  })
  @IsString()
  @IsOptional()
  assignedTo?: string;

  @ApiPropertyOptional({ example: false, description: 'Toggle WhatsApp notification alert to assignee executive' })
  @IsBoolean()
  @IsOptional()
  sendWhatsAppToAssignee?: boolean;

  @ApiPropertyOptional({ example: false, description: 'Toggle Email notification alert to assignee executive' })
  @IsBoolean()
  @IsOptional()
  sendEmailToAssignee?: boolean;

  @ApiPropertyOptional({ example: false, description: 'Toggle WhatsApp notification alert to customer' })
  @IsBoolean()
  @IsOptional()
  sendWhatsAppToCustomer?: boolean;

  @ApiPropertyOptional({ example: false, description: 'Toggle Email notification alert to customer' })
  @IsBoolean()
  @IsOptional()
  sendEmailToCustomer?: boolean;

  @ApiPropertyOptional({
    example: LeadVisibility.BRANCH,
    enum: LeadVisibility,
    description: 'Updated visibility scopes',
  })
  @IsEnum(LeadVisibility)
  @IsOptional()
  visibility?: LeadVisibility;

  @ApiPropertyOptional({ example: false, description: 'Confirms terms and conditions have been shared' })
  @IsBoolean()
  @IsOptional()
  termsShared?: boolean;

  // ==========================================
  // 3. Status Badges & Follow-up Details
  // ==========================================
  @ApiPropertyOptional({
    example: LeadTemperature.WARM,
    enum: LeadTemperature,
    description: 'Updated lead temperature badge',
  })
  @IsEnum(LeadTemperature)
  @IsOptional()
  temperature?: LeadTemperature;

  @ApiPropertyOptional({
    example: LeadStatus.WON,
    enum: LeadStatus,
    description: 'Updated lead execution status',
  })
  @IsEnum(LeadStatus)
  @IsOptional()
  status?: LeadStatus;

  @ApiPropertyOptional({ example: 'no response', description: 'Updated next followup remark' })
  @IsString()
  @IsOptional()
  nextRemark?: string;

  @ApiPropertyOptional({ example: 'Said Not Looking Any Property Now', description: 'Updated followup outcome remarks' })
  @IsString()
  @IsOptional()
  outcome?: string;

  @ApiPropertyOptional({ example: 'Rs. 1.38 Crore, 3 Bed, for Sale in Riddhi Siddhi, Pande Layout', description: 'Updated interested target property description' })
  @IsString()
  @IsOptional()
  interestedIn?: string;

  @ApiPropertyOptional({ example: 'Follow-Up Scheduled', description: 'Updated scheduled purpose classification' })
  @IsString()
  @IsOptional()
  purpose?: string;
}
