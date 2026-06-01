import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsBoolean,
  IsOptional,
  IsString,
  IsNumber,
  Min,
} from 'class-validator';
import {
  OpportunityVisibility,
  OpportunityStatus,
  OpportunityPurpose,
  OpportunityLookingFor,
  OpportunityAreaUnit,
  OpportunityBedroom,
  OpportunityFurnishing,
} from '../schemas/opportunity.schema';

export class UpdateOpportunityDto {
  @ApiPropertyOptional({
    example: '60d5ed7ab394142e88a38c29',
    description: 'Updated Contact ID reference',
  })
  @IsString()
  @IsOptional()
  contactId?: string;

  @ApiPropertyOptional({
    example: '20-May-2026',
    description: 'Updated request date',
  })
  @IsString()
  @IsOptional()
  requestDate?: string;

  @ApiPropertyOptional({
    example: '20-June-2026',
    description: 'Updated estimated closing date',
  })
  @IsString()
  @IsOptional()
  estCloseDate?: string;

  @ApiPropertyOptional({
    example: OpportunityPurpose.BUY,
    enum: OpportunityPurpose,
    description: 'Updated transaction purpose',
  })
  @IsEnum(OpportunityPurpose)
  @IsOptional()
  purpose?: OpportunityPurpose;

  @ApiPropertyOptional({
    example: OpportunityLookingFor.RESIDENTIAL_APARTMENT,
    enum: OpportunityLookingFor,
    description: 'Updated property type category',
  })
  @IsEnum(OpportunityLookingFor)
  @IsOptional()
  lookingFor?: OpportunityLookingFor;

  @ApiPropertyOptional({
    example: 50,
    description: 'Updated minimum budget range',
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  minBudget?: number;

  @ApiPropertyOptional({
    example: 80,
    description: 'Updated maximum budget range',
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  maxBudget?: number;

  @ApiPropertyOptional({
    example: 'Lacs',
    description: 'Updated budget valuation units',
  })
  @IsString()
  @IsOptional()
  budgetUnit?: string;

  @ApiPropertyOptional({
    example: 1000,
    description: 'Updated minimum property area size',
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  minArea?: number;

  @ApiPropertyOptional({
    example: 1500,
    description: 'Updated maximum property area size',
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  maxArea?: number;

  @ApiPropertyOptional({
    example: OpportunityAreaUnit.SQ_FT,
    enum: OpportunityAreaUnit,
    description: 'Updated area measurement units',
  })
  @IsEnum(OpportunityAreaUnit)
  @IsOptional()
  areaUnit?: OpportunityAreaUnit;

  @ApiPropertyOptional({
    example: 'Nagpur',
    description: 'Updated target city',
  })
  @IsString()
  @IsOptional()
  city?: string;

  @ApiPropertyOptional({
    example: 'Dhantoli',
    description: 'Updated target micro-market locality',
  })
  @IsString()
  @IsOptional()
  locality?: string;

  @ApiPropertyOptional({
    example: OpportunityBedroom.BHK_2,
    enum: OpportunityBedroom,
    description: 'Updated bedroom configuration',
  })
  @IsEnum(OpportunityBedroom)
  @IsOptional()
  bedroom?: OpportunityBedroom;

  @ApiPropertyOptional({
    example: OpportunityFurnishing.FULLY_FURNISHED,
    enum: OpportunityFurnishing,
    description: 'Updated furnishing category',
  })
  @IsEnum(OpportunityFurnishing)
  @IsOptional()
  furnishing?: OpportunityFurnishing;

  @ApiPropertyOptional({
    example: 'Resale',
    description: 'Updated transaction category type',
  })
  @IsString()
  @IsOptional()
  transaction?: string;

  @ApiPropertyOptional({
    example: 'Premium floor preferred',
    description: 'Updated customer purpose or detailed preferences',
  })
  @IsString()
  @IsOptional()
  purposePref?: string;

  @ApiPropertyOptional({
    example: '0-5 Years',
    description: 'Updated target property age',
  })
  @IsString()
  @IsOptional()
  propertyAge?: string;

  @ApiPropertyOptional({
    example: 'Looking for a flat with modern amenities and road-facing view',
    description: 'Updated general description details',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    example: 'Need to follow up urgently before the weekend',
    description: 'Updated agent private internal note',
  })
  @IsString()
  @IsOptional()
  internalNote?: string;

  // ==========================================
  // Schedule
  // ==========================================
  @ApiPropertyOptional({
    example: 'Site Visit',
    description: 'Updated scheduled purpose or stage',
  })
  @IsString()
  @IsOptional()
  schedulePurpose?: string;

  @ApiPropertyOptional({
    example: 'Scheduled detailed visit of the residential society',
    description: 'Updated schedule follow-up remark notes',
  })
  @IsString()
  @IsOptional()
  scheduleRemark?: string;

  @ApiPropertyOptional({
    example: '20-May-2026',
    description: 'Updated schedule date',
  })
  @IsString()
  @IsOptional()
  scheduleDate?: string;

  @ApiPropertyOptional({
    example: '5:00pm',
    description: 'Updated schedule time',
  })
  @IsString()
  @IsOptional()
  scheduleTime?: string;

  @ApiPropertyOptional({
    example: 'Riddhi Siddhi, Pande Layout, Dhantoli',
    description: 'Updated location where the follow-up or meeting is scheduled',
  })
  @IsString()
  @IsOptional()
  scheduleWhere?: string;

  // ==========================================
  // Save and Publish Settings
  // ==========================================
  @ApiPropertyOptional({
    example: 'Dhantoli flat 2cr',
    description: 'Updated keywords',
  })
  @IsString()
  @IsOptional()
  keyword?: string;

  @ApiPropertyOptional({
    example: 'Self / Referral',
    description: 'Updated referrer name or details',
  })
  @IsString()
  @IsOptional()
  referBy?: string;

  @ApiPropertyOptional({
    example: 'Dhantoli Premium Folder',
    description: 'Updated storage folder group name',
  })
  @IsString()
  @IsOptional()
  folder?: string;

  @ApiPropertyOptional({
    example: 'Website',
    description: 'Updated marketing channel source',
  })
  @IsString()
  @IsOptional()
  source?: string;

  @ApiPropertyOptional({
    example: 'Global Team',
    description: 'Updated branch name',
  })
  @IsString()
  @IsOptional()
  branch?: string;

  @ApiPropertyOptional({
    example: '60d5ecb8b394142e88a38c21',
    description: 'Reassign opportunity to agent User ID',
  })
  @IsString()
  @IsOptional()
  assignedTo?: string;

  @ApiPropertyOptional({
    example: 150000,
    description: 'Updated estimated revenue valuation',
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  estRevenue?: number;

  @ApiPropertyOptional({
    example: false,
    description: 'Toggle WhatsApp alert to assignee',
  })
  @IsBoolean()
  @IsOptional()
  sendWhatsAppToAssignee?: boolean;

  @ApiPropertyOptional({
    example: false,
    description: 'Toggle Email alert to assignee',
  })
  @IsBoolean()
  @IsOptional()
  sendEmailToAssignee?: boolean;

  @ApiPropertyOptional({
    example: false,
    description: 'Toggle WhatsApp alert to customer',
  })
  @IsBoolean()
  @IsOptional()
  sendWhatsAppToCustomer?: boolean;

  @ApiPropertyOptional({
    example: false,
    description: 'Toggle Email alert to customer',
  })
  @IsBoolean()
  @IsOptional()
  sendEmailToCustomer?: boolean;

  @ApiPropertyOptional({
    example: OpportunityVisibility.BRANCH,
    enum: OpportunityVisibility,
    description: 'Updated visibility scope permissions',
  })
  @IsEnum(OpportunityVisibility)
  @IsOptional()
  visibility?: OpportunityVisibility;

  @ApiPropertyOptional({
    example: false,
    description: 'Protect this record from general sharing',
  })
  @IsBoolean()
  @IsOptional()
  protected?: boolean;

  @ApiPropertyOptional({
    example: false,
    description: 'Automatically generate property match alerts',
  })
  @IsBoolean()
  @IsOptional()
  matchingAlert?: boolean;

  @ApiPropertyOptional({
    example: OpportunityStatus.WON,
    enum: OpportunityStatus,
    description: 'Updated pipeline execution status',
  })
  @IsEnum(OpportunityStatus)
  @IsOptional()
  status?: OpportunityStatus;
}
