import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsEnum,
  IsBoolean,
  IsOptional,
  IsString,
  IsNumber,
  Min,
  IsArray,
} from 'class-validator';
import { ProjectVisibility, ProjectStatus } from '../schemas/project.schema';

export class CreateProjectDto {
  // ==========================================
  // Step 1: Contact Information (Owner)
  // ==========================================
  @ApiPropertyOptional({
    example: '60d5ec7ab394142e88a38c29',
    description:
      'Target Contact ID registered in CRM Contacts. Required if addNewContact is false/omitted.',
  })
  @IsString()
  @IsOptional()
  contactId?: string;

  @ApiPropertyOptional({
    example: false,
    description:
      'Whether to add a new contact on-the-fly when creating the project',
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  addNewContact?: boolean;

  @ApiPropertyOptional({
    example: 'Mr Rajendra Patil',
    description: 'Target project owner contact name when adding on-the-fly',
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({
    example: '+91 9876543210',
    description: 'Target project owner contact mobile when adding on-the-fly',
  })
  @IsString()
  @IsOptional()
  mobile?: string;

  @ApiPropertyOptional({
    example: 'patil@gmail.com',
    description: 'Target project owner contact email when adding on-the-fly',
  })
  @IsString()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({
    example: 'Patil Developers Group',
    description: 'Target project owner company name when adding on-the-fly',
  })
  @IsString()
  @IsOptional()
  company?: string;

  // ==========================================
  // Step 2: Basic Information
  // ==========================================
  @ApiProperty({
    example: '2026-06-01',
    description: 'Project launch date',
  })
  @IsString()
  @IsNotEmpty({ message: 'Launch Date is required' })
  launchDate: string;

  @ApiProperty({
    example: 'Patil Heights',
    description: 'Name of the Project',
  })
  @IsString()
  @IsNotEmpty({ message: 'Project Name is required' })
  projectName: string;

  @ApiPropertyOptional({
    example: 'PR/MH/NAG/2026/05',
    description: 'RERA/HIRA registration number',
  })
  @IsString()
  @IsOptional()
  reraNumber?: string;

  @ApiPropertyOptional({
    example: 'NAG-101',
    description: 'District code name',
  })
  @IsString()
  @IsOptional()
  districtCode?: string;

  @ApiPropertyOptional({
    example: 90,
    description: 'Locking duration in days',
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  lockingDuration?: number;

  @ApiPropertyOptional({
    example: 50000,
    description: 'Total project layout area size',
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  projectArea?: number;

  @ApiPropertyOptional({
    example: 'Sq.Ft.',
    description: 'Area unit (e.g. Sq.Ft., Sq.Meter)',
  })
  @IsString()
  @IsOptional()
  areaUnit?: string;

  @ApiPropertyOptional({
    example: 'Apartment',
    description: 'Project type',
  })
  @IsString()
  @IsOptional()
  type?: string;

  @ApiPropertyOptional({
    example: '3 BHK',
    description: 'Total room configuration details',
  })
  @IsString()
  @IsOptional()
  totalRoom?: string;

  @ApiPropertyOptional({
    example: 8500000,
    description: 'Project base pricing amount',
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  price?: number;

  @ApiPropertyOptional({
    example: '2 BHK Flats',
    description: 'What configurations customers are interested in',
  })
  @IsString()
  @IsOptional()
  interestedIn?: string;

  @ApiPropertyOptional({
    example: 'New Launch',
    description: 'Transaction type category',
  })
  @IsString()
  @IsOptional()
  transactionType?: string;

  @ApiPropertyOptional({
    example: 'Patil Builders Ltd',
    description: 'Developer company name',
  })
  @IsString()
  @IsOptional()
  developerName?: string;

  @ApiPropertyOptional({
    example: 'Luxury residential township with state of the art amenities.',
    description: 'Descriptive details (Max 2000 chars)',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    example: 'Awaiting final landscaping works',
    description: 'Internal remark details (Max 2000 chars)',
  })
  @IsString()
  @IsOptional()
  remark?: string;

  @ApiPropertyOptional({
    example: 'Nagpur Municipal Corporation (NMC)',
    description: 'Authority that approved the project layout',
  })
  @IsString()
  @IsOptional()
  approvedBy?: string;

  @ApiPropertyOptional({
    example: false,
    description: 'Commencement Certificate status toggle',
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  commencementCertificate?: boolean;

  @ApiPropertyOptional({
    example: false,
    description: 'Occupancy Certificate status toggle',
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  occupancyCertificate?: boolean;

  // ==========================================
  // Step 3: Specifications
  // ==========================================
  @ApiPropertyOptional({
    example: '<p>Vitrified tiles, teak wood doors, premium fittings...</p>',
    description: 'Important project specifications (HTML supported)',
  })
  @IsString()
  @IsOptional()
  specification?: string;

  @ApiPropertyOptional({
    example: 40,
    description: 'Percentage of open space in the layout design',
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  openSpacePercentage?: number;

  @ApiPropertyOptional({
    example: ['Clubhouse', 'Gym', 'Swimming Pool', 'Childrens Play Area'],
    description: 'List of community amenities',
  })
  @IsArray()
  @IsOptional()
  amenities?: string[];

  @ApiPropertyOptional({
    example: 'https://youtube.com/watch?v=mock-id',
    description: 'Promotion/site layout video url',
  })
  @IsString()
  @IsOptional()
  videoUrl?: string;

  @ApiPropertyOptional({
    example: 'https://vimeo.com/mock-id',
    description: 'Virtual walkthrough video url',
  })
  @IsString()
  @IsOptional()
  virtualVideoUrl?: string;

  @ApiPropertyOptional({
    example: 'luxury apartments, patil heights nagpur',
    description: 'Keywords to optimize SEO ranking',
  })
  @IsString()
  @IsOptional()
  websiteKeywords?: string;

  // ==========================================
  // Step 4: Location Details
  // ==========================================
  @ApiPropertyOptional({
    example: 'Opposite Riddhi Siddhi, Pande Layout, Wardha Road',
    description: 'Physical descriptive address location',
  })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiPropertyOptional({
    example: 21.1234,
    description: 'Geodetic Latitude coordinate',
  })
  @IsNumber()
  @IsOptional()
  latitude?: number;

  @ApiPropertyOptional({
    example: 79.5678,
    description: 'Geodetic Longitude coordinate',
  })
  @IsNumber()
  @IsOptional()
  longitude?: number;

  @ApiPropertyOptional({
    example: 'Tower A & B',
    description: 'Building/Premises block identifier details',
  })
  @IsString()
  @IsOptional()
  buildingPremises?: string;

  @ApiProperty({
    example: 'Nagpur',
    description: 'Target city location',
  })
  @IsString()
  @IsNotEmpty({ message: 'City is required' })
  city: string;

  @ApiProperty({
    example: 'Dhantoli',
    description: 'Target locality micro-market location',
  })
  @IsString()
  @IsNotEmpty({ message: 'Locality is required' })
  locality: string;

  @ApiPropertyOptional({
    example: 'Behind Metro Station',
    description: 'Landmark details',
  })
  @IsString()
  @IsOptional()
  landmark?: string;

  @ApiPropertyOptional({
    example: '440012',
    description: 'Location Pin Code',
  })
  @IsString()
  @IsOptional()
  pinCode?: string;

  // ==========================================
  // Step 5: Save and Publish
  // ==========================================
  @ApiPropertyOptional({
    example: 'Premium Residential Project',
    description: 'Matchmaking keyword tags',
  })
  @IsString()
  @IsOptional()
  keyword?: string;

  @ApiPropertyOptional({
    example: 'Nagpur East Projects',
    description: 'Storage folder folder name grouping',
  })
  @IsString()
  @IsOptional()
  folder?: string;

  @ApiProperty({
    example: 'Global Team',
    description: 'Office branch division assignment name',
  })
  @IsString()
  @IsNotEmpty({ message: 'Branch is required' })
  branch: string;

  @ApiPropertyOptional({
    example: '60d5ecb8b394142e88a38c21',
    description: 'Assigned executive User ID. Defaults to requesting user.',
  })
  @IsString()
  @IsOptional()
  assignedTo?: string;

  @ApiPropertyOptional({
    example: false,
    description: 'Featured project catalog highlights display',
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  featuredProject?: boolean;

  @ApiPropertyOptional({
    example: ProjectVisibility.PRIVATE,
    enum: ProjectVisibility,
    description: 'Visibility scope permissions permissions',
    default: ProjectVisibility.PRIVATE,
  })
  @IsEnum(ProjectVisibility)
  @IsOptional()
  visibility?: ProjectVisibility;

  @ApiPropertyOptional({
    example: ProjectStatus.AVAILABLE,
    enum: ProjectStatus,
    description: 'Project listing status status',
    default: ProjectStatus.AVAILABLE,
  })
  @IsEnum(ProjectStatus)
  @IsOptional()
  status?: ProjectStatus;

  @ApiPropertyOptional({
    example: false,
    description: 'Whether the project is published on the website',
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  publishedOnWebsite?: boolean;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  completionDate?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  possession?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  possessionMonth?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  possessionYear?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  preferName?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  preferredFacls?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  zoneNumber?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional({
    type: [Object],
    description: 'Project unit/plan configurations',
    default: [],
  })
  @IsArray()
  @IsOptional()
  plans?: any[];
}
