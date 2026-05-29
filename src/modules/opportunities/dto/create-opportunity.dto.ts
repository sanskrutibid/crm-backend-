import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsEnum, IsBoolean, IsOptional, IsString, IsNumber, Min } from 'class-validator';
import { 
  OpportunityVisibility, 
  OpportunityStatus,
  OpportunityPurpose,
  OpportunityLookingFor,
  OpportunityAreaUnit,
  OpportunityBedroom,
  OpportunityFurnishing
} from '../schemas/opportunity.schema';

export class CreateOpportunityDto {
  // ==========================================
  // 1. Contact Information (Step 1)
  // ==========================================
  @ApiPropertyOptional({
    example: '60d5ec7ab394142e88a38c29',
    description: 'Target Contact ID registered in the CRM Contacts directory. Required if addNewContact is false/omitted.',
  })
  @IsString()
  @IsOptional()
  contactId?: string;

  @ApiPropertyOptional({
    example: false,
    description: 'Whether to add a new contact on-the-fly when creating the opportunity',
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

  // ==========================================
  // 2. Basic Requirement (Step 2)
  // ==========================================
  @ApiProperty({
    example: '20-May-2026',
    description: 'Date when requirement was requested',
  })
  @IsString()
  @IsNotEmpty({ message: 'Request Date is required' })
  requestDate: string;

  @ApiPropertyOptional({
    example: '20-June-2026',
    description: 'Estimated closing date for the deal',
  })
  @IsString()
  @IsOptional()
  estCloseDate?: string;

  @ApiProperty({
    example: OpportunityPurpose.BUY,
    enum: OpportunityPurpose,
    description: 'Transaction purpose (For*)',
  })
  @IsEnum(OpportunityPurpose)
  @IsNotEmpty({ message: 'Purpose is required' })
  purpose: OpportunityPurpose;

  @ApiProperty({
    example: OpportunityLookingFor.RESIDENTIAL_APARTMENT,
    enum: OpportunityLookingFor,
    description: 'Property type category (Looking For*)',
  })
  @IsEnum(OpportunityLookingFor)
  @IsNotEmpty({ message: 'Looking For is required' })
  lookingFor: OpportunityLookingFor;

  @ApiProperty({
    example: 50,
    description: 'Minimum budget range',
  })
  @IsNumber()
  @Min(0)
  @IsNotEmpty({ message: 'Minimum budget is required' })
  minBudget: number;

  @ApiProperty({
    example: 80,
    description: 'Maximum budget range',
  })
  @IsNumber()
  @Min(0)
  @IsNotEmpty({ message: 'Maximum budget is required' })
  maxBudget: number;

  @ApiProperty({
    example: 'Lacs',
    description: 'Budget valuation currency units (e.g. Lacs, Crore)',
  })
  @IsString()
  @IsNotEmpty({ message: 'Budget unit is required' })
  budgetUnit: string;

  @ApiProperty({
    example: 1000,
    description: 'Minimum property area size range',
  })
  @IsNumber()
  @Min(0)
  @IsNotEmpty({ message: 'Minimum area is required' })
  minArea: number;

  @ApiProperty({
    example: 1500,
    description: 'Maximum property area size range',
  })
  @IsNumber()
  @Min(0)
  @IsNotEmpty({ message: 'Maximum area is required' })
  maxArea: number;

  @ApiProperty({
    example: OpportunityAreaUnit.SQ_FT,
    enum: OpportunityAreaUnit,
    description: 'Area measurement units (Area*)',
  })
  @IsEnum(OpportunityAreaUnit)
  @IsNotEmpty({ message: 'Area unit is required' })
  areaUnit: OpportunityAreaUnit;

  @ApiProperty({
    example: 'Nagpur',
    description: 'Target city location',
  })
  @IsString()
  @IsNotEmpty({ message: 'City is required' })
  city: string;

  @ApiProperty({
    example: 'Dhantoli',
    description: 'Target micro-market locality',
  })
  @IsString()
  @IsNotEmpty({ message: 'Locality is required' })
  locality: string;

  @ApiPropertyOptional({
    example: OpportunityBedroom.BHK_2,
    enum: OpportunityBedroom,
    description: 'BHK/Bedroom configuration selection',
  })
  @IsEnum(OpportunityBedroom)
  @IsOptional()
  bedroom?: OpportunityBedroom;

  @ApiPropertyOptional({
    example: OpportunityFurnishing.FULLY_FURNISHED,
    enum: OpportunityFurnishing,
    description: 'Furnishing category details',
  })
  @IsEnum(OpportunityFurnishing)
  @IsOptional()
  furnishing?: OpportunityFurnishing;

  @ApiPropertyOptional({
    example: 'Resale',
    description: 'Transaction category type (e.g. New Property, Resale)',
  })
  @IsString()
  @IsOptional()
  transaction?: string;

  @ApiPropertyOptional({
    example: 'Premium floor preferred',
    description: 'Customer purpose or detailed preferences',
  })
  @IsString()
  @IsOptional()
  purposePref?: string;

  @ApiPropertyOptional({
    example: '0-5 Years',
    description: 'Target property age description',
  })
  @IsString()
  @IsOptional()
  propertyAge?: string;

  @ApiPropertyOptional({
    example: 'Looking for a flat with modern amenities and road-facing view',
    description: 'General raw description details',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    example: 'Need to follow up urgently before the weekend',
    description: 'Agent private internal note',
  })
  @IsString()
  @IsOptional()
  internalNote?: string;

  // ==========================================
  // 3. Schedule (Step 3)
  // ==========================================
  @ApiProperty({
    example: 'Site Visit',
    description: 'Scheduled purpose classification or stage',
  })
  @IsString()
  @IsNotEmpty({ message: 'Schedule purpose is required' })
  schedulePurpose: string;

  @ApiPropertyOptional({
    example: 'Scheduled detailed visit of the residential society',
    description: 'Schedule follow-up remark notes',
  })
  @IsString()
  @IsOptional()
  scheduleRemark?: string;

  @ApiProperty({
    example: '20-May-2026',
    description: 'Schedule execution date',
  })
  @IsString()
  @IsNotEmpty({ message: 'Schedule date is required' })
  scheduleDate: string;

  @ApiProperty({
    example: '5:00pm',
    description: 'Schedule execution time',
  })
  @IsString()
  @IsNotEmpty({ message: 'Schedule time is required' })
  scheduleTime: string;

  @ApiPropertyOptional({
    example: 'Riddhi Siddhi, Pande Layout, Dhantoli',
    description: 'Location where the follow-up or meeting is scheduled',
  })
  @IsString()
  @IsOptional()
  scheduleWhere?: string;

  // ==========================================
  // 4. Save and Publish (Step 4)
  // ==========================================
  @ApiPropertyOptional({
    example: 'Dhantoli flat 2cr',
    description: 'Keywords to index for matchmaking searches',
  })
  @IsString()
  @IsOptional()
  keyword?: string;

  @ApiPropertyOptional({
    example: 'Self / Referral',
    description: 'Referrer name or lead channel referrer details',
  })
  @IsString()
  @IsOptional()
  referBy?: string;

  @ApiPropertyOptional({
    example: 'Dhantoli Premium Folder',
    description: 'Storage folder name group',
  })
  @IsString()
  @IsOptional()
  folder?: string;

  @ApiProperty({
    example: 'Website',
    description: 'Marketing channel source',
  })
  @IsString()
  @IsNotEmpty({ message: 'Source is required' })
  source: string;

  @ApiProperty({
    example: 'Global Team',
    description: 'Office branch division assignment name',
  })
  @IsString()
  @IsNotEmpty({ message: 'Branch is required' })
  branch: string;

  @ApiPropertyOptional({
    example: '60d5ecb8b394142e88a38c21',
    description: 'Assigned executive User ID. Defaults to the requesting user.',
  })
  @IsString()
  @IsOptional()
  assignedTo?: string;

  @ApiPropertyOptional({
    example: 150000,
    description: 'Estimated potential revenue valuation',
    default: 0,
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  estRevenue?: number;

  @ApiPropertyOptional({ example: false, description: 'Alert Assignee via WhatsApp', default: false })
  @IsBoolean()
  @IsOptional()
  sendWhatsAppToAssignee?: boolean;

  @ApiPropertyOptional({ example: false, description: 'Alert Assignee via Email', default: false })
  @IsBoolean()
  @IsOptional()
  sendEmailToAssignee?: boolean;

  @ApiPropertyOptional({ example: false, description: 'Alert Customer via WhatsApp', default: false })
  @IsBoolean()
  @IsOptional()
  sendWhatsAppToCustomer?: boolean;

  @ApiPropertyOptional({ example: false, description: 'Alert Customer via Email', default: false })
  @IsBoolean()
  @IsOptional()
  sendEmailToCustomer?: boolean;

  @ApiPropertyOptional({
    example: OpportunityVisibility.PRIVATE,
    enum: OpportunityVisibility,
    description: 'Visibility scope permissions',
    default: OpportunityVisibility.PRIVATE,
  })
  @IsEnum(OpportunityVisibility)
  @IsOptional()
  visibility?: OpportunityVisibility;

  @ApiPropertyOptional({ example: false, description: 'Protect this record from general sharing', default: false })
  @IsBoolean()
  @IsOptional()
  protected?: boolean;

  @ApiPropertyOptional({ example: false, description: 'Automatically generate property match alerts', default: false })
  @IsBoolean()
  @IsOptional()
  matchingAlert?: boolean;

  @ApiPropertyOptional({
    example: OpportunityStatus.IN_PROGRESS,
    enum: OpportunityStatus,
    description: 'Initial pipeline lifecycle status',
    default: OpportunityStatus.IN_PROGRESS,
  })
  @IsEnum(OpportunityStatus)
  @IsOptional()
  status?: OpportunityStatus;
}
