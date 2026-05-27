import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { LeadTemperature, LeadStatus, LeadVisibility } from '../schemas/lead.schema';
import { AuthUserDto } from '../../auth/dto/auth-response.dto';
import { ContactResponseDto } from '../../contacts/dto/contact-response.dto';

export class LeadResponseDto {
  @ApiProperty({ example: '60d5ed7ab394142e88a38c29', description: 'Lead unique database ID' })
  id: string;

  // ==========================================
  // 1. Lead Information (Step 1)
  // ==========================================
  @ApiProperty({ description: 'Contact profile associated with this lead', type: ContactResponseDto })
  contactId: ContactResponseDto;

  @ApiProperty({ example: 'Rs. 1.38 Crore, 3 Bed, for Sale in Riddhi Siddhi, Pande Layout', description: 'Lead basic requirement details' })
  requirement: string;

  @ApiProperty({ example: 'Client seems highly interested, scheduled site visit.', description: 'Initial followup notes' })
  followupNote: string;

  @ApiProperty({ example: '26-May-2026', description: 'Followup scheduled date (YYYY-MM-DD)' })
  scheduleDate: string;

  @ApiProperty({ example: '4:34pm', description: 'Followup scheduled time' })
  scheduleTime: string;

  @ApiProperty({ example: 4.5, description: 'Lead requirement score ratio' })
  score: number;

  // ==========================================
  // 2. Save and Publish Settings (Step 2)
  // ==========================================
  @ApiPropertyOptional({ example: 'Dhantoli, 172Sqft flat 2cr', description: 'Property specification keywords/tags' })
  keywords?: string;

  @ApiPropertyOptional({ example: 'Premium Leads Folder', description: 'Target CRM lead storage folder name' })
  folder?: string;

  @ApiProperty({ example: 'Website Form', description: 'Discovery lead channel source' })
  source: string;

  @ApiProperty({ example: 'Global Team', description: 'Assigned CRM office branch location' })
  branch: string;

  @ApiProperty({ description: 'CRM executive assigned to this lead', type: AuthUserDto })
  assignedTo: AuthUserDto;

  @ApiProperty({ example: false, description: 'WhatsApp alert notification to assignee' })
  sendWhatsAppToAssignee: boolean;

  @ApiProperty({ example: false, description: 'Email alert notification to assignee' })
  sendEmailToAssignee: boolean;

  @ApiProperty({ example: false, description: 'WhatsApp confirmation notification to customer' })
  sendWhatsAppToCustomer: boolean;

  @ApiProperty({ example: false, description: 'Email confirmation notification to customer' })
  sendEmailToCustomer: boolean;

  @ApiProperty({ example: 'Private', enum: LeadVisibility, description: 'Visibility scope permissions' })
  visibility: LeadVisibility;

  @ApiProperty({ example: false, description: 'Terms and conditions shared confirmation status' })
  termsShared: boolean;

  // ==========================================
  // 3. Status Badges & Follow-up Details
  // ==========================================
  @ApiProperty({ example: 'Cold', enum: LeadTemperature, description: 'Urgency temperature badge classification' })
  temperature: LeadTemperature;

  @ApiProperty({ example: 'In Progress', enum: LeadStatus, description: 'Lifecycle follow-up execution status' })
  status: LeadStatus;

  @ApiPropertyOptional({ example: 'no response', description: 'Next follow-up operational remark' })
  nextRemark?: string;

  @ApiPropertyOptional({ example: 'Said Not Looking Any Property Now', description: 'Follow-up outcome remark details' })
  outcome?: string;

  @ApiPropertyOptional({ example: 'Rs. 1.38 Crore, 3 Bed, for Sale in Riddhi Siddhi, Pande Layout', description: 'Interested target property description' })
  interestedIn?: string;

  @ApiPropertyOptional({ example: 'Follow-Up Scheduled', description: 'Schedule execution purpose' })
  purpose?: string;

  @ApiProperty({ example: '2026-05-26T14:04:03.000Z', description: 'Timestamp of lead assignment' })
  assignDate: string;

  @ApiPropertyOptional({ description: 'User profile who registered this lead', type: AuthUserDto })
  createdBy?: AuthUserDto;

  @ApiPropertyOptional({ description: 'User profile who last updated this lead', type: AuthUserDto })
  updatedBy?: AuthUserDto;

  @ApiProperty({ example: '2026-05-26T14:04:03.000Z', description: 'Timestamp of lead registration' })
  createdAt: string;

  @ApiProperty({ example: '2026-05-26T14:04:03.000Z', description: 'Timestamp of last change' })
  updatedAt: string;
}
