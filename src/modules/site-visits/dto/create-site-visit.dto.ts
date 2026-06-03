import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateSiteVisitDto {
  @ApiProperty({
    example: 'Avinash Bhute',
    description: 'Visitor full name',
  })
  @IsString()
  @IsNotEmpty({ message: 'Visitor name is required' })
  visitor: string;

  @ApiProperty({
    example: 'First Visit',
    description: 'Type of visit (e.g. First Visit, Re-visit)',
  })
  @IsString()
  @IsNotEmpty({ message: 'Visit Type is required' })
  visitType: string;

  @ApiProperty({
    example: 'Lead',
    description: 'Target CRM module (e.g. Lead, Contact)',
  })
  @IsString()
  @IsNotEmpty({ message: 'Module is required' })
  module: string;

  @ApiPropertyOptional({
    example: 'Metro City',
    description: 'Target property site name',
  })
  @IsString()
  @IsOptional()
  siteName?: string;

  @ApiPropertyOptional({
    example: 'Tower A',
    description: 'Alternative or custom name description',
  })
  @IsString()
  @IsOptional()
  otherName?: string;

  @ApiProperty({
    example: '2026-06-03',
    description: 'Scheduled visit date',
  })
  @IsString()
  @IsNotEmpty({ message: 'Visit Date is required' })
  visitDate: string;

  @ApiProperty({
    example: '11:26 AM',
    description: 'Arrival check-in time',
  })
  @IsString()
  @IsNotEmpty({ message: 'Time In is required' })
  timeIn: string;

  @ApiProperty({
    example: '12:10 PM',
    description: 'Departure check-out time',
  })
  @IsString()
  @IsNotEmpty({ message: 'Time Out is required' })
  timeOut: string;

  @ApiPropertyOptional({
    example: 'Highly interested in booking the penthouse unit.',
    description: 'Visit remark details',
  })
  @IsString()
  @IsOptional()
  remark?: string;

  @ApiProperty({
    example: 'Gourav Raut',
    description: 'Site Manager full name',
  })
  @IsString()
  @IsNotEmpty({ message: 'Site Manager is required' })
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

  @ApiProperty({
    example: 'Website Form',
    description: 'Discovery source',
  })
  @IsString()
  @IsNotEmpty({ message: 'Source is required' })
  source: string;

  @ApiProperty({
    example: 'Metro City Branch',
    description: 'Assigned CRM office branch location name',
  })
  @IsString()
  @IsNotEmpty({ message: 'Branch is required' })
  branch: string;

  @ApiProperty({
    example: '60d5ecb8b394142e88a38c21',
    description: 'Assigned CRM Agent/User MongoDB ID',
  })
  @IsString()
  @IsNotEmpty({ message: 'Assignee is required' })
  assignee: string;

  @ApiProperty({
    example: 'Scheduled',
    description: 'Lifecycle status of visit',
  })
  @IsString()
  @IsNotEmpty({ message: 'Visit Status is required' })
  visitStatus: string;

  @ApiPropertyOptional({
    example: false,
    description: 'Send confirmation SMS alert notification',
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  sendSmsNotification?: boolean;

  @ApiPropertyOptional({
    example: true,
    description: 'Send confirmation Email alert notification',
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  sendEmailNotification?: boolean;

  @ApiPropertyOptional({
    example: false,
    description: 'Visibility scope restrictions (Private or Public)',
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  isPrivate?: boolean;

  @ApiPropertyOptional({
    example: 'https://cdn.example.com/uploads/visit-photo.jpg',
    description: 'Upload path of branch photograph',
  })
  @IsString()
  @IsOptional()
  photograph?: string;

  @ApiPropertyOptional({
    example: 21.1458,
    description: 'Latitude GPS coordinate captured during visit check-in',
  })
  @IsNumber()
  @IsOptional()
  latitude?: number;

  @ApiPropertyOptional({
    example: 79.0882,
    description: 'Longitude GPS coordinate captured during visit check-in',
  })
  @IsNumber()
  @IsOptional()
  longitude?: number;

  @ApiPropertyOptional({
    example: '60d5ecb8b394142e88a38c21',
    description: 'User ID of the person submitting the site visit request',
  })
  @IsString()
  @IsOptional()
  createdBy?: string;

  @ApiPropertyOptional({
    example: 5,
    description: 'Number of locking days remaining for site check-in',
  })
  @IsNumber()
  @IsOptional()
  lockingDaysLeft?: number;

  @ApiPropertyOptional({
    example: 1,
    description: 'Number of re-visits for this client',
  })
  @IsNumber()
  @IsOptional()
  noOfReVisit?: number;

  @ApiPropertyOptional({
    example: 'Client satisfied with sample unit design layout',
    description: 'Outcome or reason explanation notes',
  })
  @IsString()
  @IsOptional()
  reasons?: string;

  @ApiPropertyOptional({
    example: '60d5ecb8b394142e88a38c22',
    description: 'Reference to associated Lead MongoDB ID',
  })
  @IsString()
  @IsOptional()
  leadId?: string;

  @ApiPropertyOptional({
    example: '60d5ecb8b394142e88a38c23',
    description: 'Reference to associated Contact MongoDB ID',
  })
  @IsString()
  @IsOptional()
  contactId?: string;
}
