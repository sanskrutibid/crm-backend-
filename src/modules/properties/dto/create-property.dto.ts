import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsBoolean,
  IsArray,
  Min,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { PropertyStatus } from '../schemas/property.schema';

export class CreatePropertyDto {
  // ==========================================
  // Ownership / Assignment References
  // ==========================================
  @ApiPropertyOptional({
    example: '60d5ecb8b394142e88a38c21',
    description: 'User ID of property creator',
  })
  @IsString()
  @IsOptional()
  createdBy?: string;

  @ApiPropertyOptional({
    example: '60d5ecb8b394142e88a38c21',
    description: 'Assigned User ID',
  })
  @IsString()
  @IsOptional()
  assignedTo?: string;

  // ==========================================
  // Legacy / Base Fields (Compatible Mode)
  // ==========================================
  @ApiPropertyOptional({
    example: 'Greenwood Luxury Residency',
    description: 'Name of the real-estate property project',
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({
    example: 'Bandra West, Mumbai',
    description: 'Geographical location/address of the property',
  })
  @IsString()
  @IsOptional()
  location?: string;

  @ApiPropertyOptional({
    example: '3 BHK Premium Apartment',
    description: 'Configuration or description of unit layout type',
  })
  @IsString()
  @IsOptional()
  type?: string;

  @ApiPropertyOptional({
    example: '₹2.75 Cr',
    description: 'Price display value (e.g., in rupees or crores)',
  })
  @IsString()
  @IsOptional()
  price?: string;

  @ApiPropertyOptional({
    example: 1850,
    description: 'Total build-up size of property unit in square feet',
  })
  @IsNumber()
  @Min(0, { message: 'Sqft cannot be negative' })
  @IsOptional()
  sqft?: number;

  @ApiPropertyOptional({
    example: PropertyStatus.AVAILABLE,
    enum: PropertyStatus,
    description: 'Current sales availability status of listings',
    default: PropertyStatus.AVAILABLE,
  })
  @IsEnum(PropertyStatus, { message: 'Invalid property status' })
  @IsOptional()
  status?: PropertyStatus;

  @ApiPropertyOptional({
    example: 'Greenwood Infra Corp',
    description: 'Builder or Developer company branding name',
  })
  @IsString()
  @IsOptional()
  builder?: string;

  // ==========================================
  // Step 1: Contact Information
  // ==========================================
  @ApiPropertyOptional({
    example: 'John Doe',
    description: 'Owner or Landlord name/ID',
  })
  @IsString()
  @IsOptional()
  ownerLandlord?: string;

  // ==========================================
  // Step 2: Basic Information
  // ==========================================
  @ApiPropertyOptional({ example: '2026-06-01', description: 'Request Date' })
  @IsString()
  @IsOptional()
  requestDate?: string;

  @ApiPropertyOptional({ example: 'Self', description: 'FO (Field Officer)' })
  @IsString()
  @IsOptional()
  fo?: string;

  @ApiPropertyOptional({
    example: 'Residential',
    description: 'Property type dropdown value',
  })
  @IsString()
  @IsOptional()
  propertyType?: string;

  @ApiPropertyOptional({
    example: 'Residential',
    description: 'Property category (e.g. Residential, Commercial, etc.)',
  })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiPropertyOptional({ example: 'Rent', description: 'Transaction type' })
  @IsString()
  @IsOptional()
  transaction?: string;

  @ApiPropertyOptional({
    example: 'Freehold',
    description: 'Ownership details',
  })
  @IsString()
  @IsOptional()
  ownership?: string;

  @ApiPropertyOptional({
    example: '3 BHK',
    description: 'Number of bedrooms configuration',
  })
  @IsString()
  @IsOptional()
  bedroom?: string;

  @ApiPropertyOptional({
    example: 'Fully Furnished',
    description: 'Furnishing status',
  })
  @IsString()
  @IsOptional()
  furnishing?: string;

  @ApiPropertyOptional({
    example: 'Family',
    description: 'Suitable for target customers',
  })
  @IsString()
  @IsOptional()
  suitableFor?: string;

  @ApiPropertyOptional({
    example: 'Sea View',
    description: 'Unique premium feature',
  })
  @IsString()
  @IsOptional()
  uniqueFeature?: string;

  @ApiPropertyOptional({
    example: 'Direct Client',
    description: 'Acquisition channel',
  })
  @IsString()
  @IsOptional()
  channel?: string;

  @ApiPropertyOptional({
    example: 'Premium duplex apartment with modern amenities.',
    description: 'Long description',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    example: 'Highly motivated owner.',
    description: 'General remarks',
  })
  @IsString()
  @IsOptional()
  remark?: string;

  @ApiPropertyOptional({
    example: 'Verify original registry papers before closing.',
    description: 'Internal team notes',
  })
  @IsString()
  @IsOptional()
  internalNote?: string;

  @ApiPropertyOptional({
    example: true,
    description: 'Whether property documents are verified',
  })
  @IsBoolean()
  @IsOptional()
  verifiedDocuments?: boolean;

  @ApiPropertyOptional({
    example: true,
    description: 'Whether physical property visit is completed',
  })
  @IsBoolean()
  @IsOptional()
  completedVisit?: boolean;

  // ==========================================
  // Step 3: Location Details
  // ==========================================
  @ApiPropertyOptional({
    example: 19.076,
    description: 'Map Latitude coordinate',
  })
  @IsNumber()
  @IsOptional()
  latitude?: number;

  @ApiPropertyOptional({
    example: 72.877,
    description: 'Map Longitude coordinate',
  })
  @IsNumber()
  @IsOptional()
  longitude?: number;

  @ApiPropertyOptional({
    example: 'Carter Road, Bandra West',
    description: 'Street address',
  })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiPropertyOptional({
    example: 'Flat 1202',
    description: 'Flat or Office unit number',
  })
  @IsString()
  @IsOptional()
  flatOfficeUnitNo?: string;

  @ApiPropertyOptional({
    example: 'SV-991',
    description: 'Survey or plot number',
  })
  @IsString()
  @IsOptional()
  surveyNumber?: string;

  @ApiPropertyOptional({
    example: 'Carter Survey Area',
    description: 'Survey registry name',
  })
  @IsString()
  @IsOptional()
  surveyName?: string;

  @ApiPropertyOptional({
    example: 'Skyline Residency',
    description: 'Project or developer brand',
  })
  @IsString()
  @IsOptional()
  projectDeveloperName?: string;

  @ApiPropertyOptional({
    example: 'Tower A',
    description: 'Specific building block or tower name',
  })
  @IsString()
  @IsOptional()
  buildingTowerProject?: string;

  @ApiPropertyOptional({
    example: 'Main Carter Road',
    description: 'Street name',
  })
  @IsString()
  @IsOptional()
  street?: string;

  @ApiPropertyOptional({
    example: 'Near Otters Club',
    description: 'Local landmark',
  })
  @IsString()
  @IsOptional()
  landmark?: string;

  @ApiPropertyOptional({ example: '400050', description: 'Zip/Pin code' })
  @IsString()
  @IsOptional()
  pincode?: string;

  @ApiPropertyOptional({ example: 'Mumbai', description: 'City name' })
  @IsString()
  @IsOptional()
  city?: string;

  @ApiPropertyOptional({
    example: 'Bandra West',
    description: 'Locality/neighborhood name',
  })
  @IsString()
  @IsOptional()
  locality?: string;

  // ==========================================
  // Step 4: Area and Pricing
  // ==========================================
  @ApiPropertyOptional({
    example: 1500,
    description: 'Primary size/area value',
  })
  @IsNumber()
  @IsOptional()
  area?: number;

  @ApiPropertyOptional({
    example: 'Sq. Ft.',
    description: 'Area measurement unit',
  })
  @IsString()
  @IsOptional()
  areaUnit?: string;

  @ApiPropertyOptional({ example: 1800, description: 'Built-up area size' })
  @IsNumber()
  @IsOptional()
  builtUpArea?: number;

  @ApiPropertyOptional({
    example: 'Sq. Ft.',
    description: 'Built-up area unit',
  })
  @IsString()
  @IsOptional()
  builtUpAreaUnit?: string;

  @ApiPropertyOptional({ example: 1400, description: 'Carpet area size' })
  @IsNumber()
  @IsOptional()
  carpetArea?: number;

  @ApiPropertyOptional({ example: 'Sq. Ft.', description: 'Carpet area unit' })
  @IsString()
  @IsOptional()
  carpetAreaUnit?: string;

  @ApiPropertyOptional({ example: 200, description: 'Terrace area size' })
  @IsNumber()
  @IsOptional()
  terraceArea?: number;

  @ApiPropertyOptional({ example: 'Sq. Ft.', description: 'Terrace area unit' })
  @IsString()
  @IsOptional()
  terraceAreaUnit?: string;

  @ApiPropertyOptional({ example: 1600, description: 'Area range' })
  @IsNumber()
  @IsOptional()
  areaRange?: number;

  @ApiPropertyOptional({ example: 'Sq. Ft.', description: 'Area range unit' })
  @IsString()
  @IsOptional()
  areaRangeUnit?: string;

  @ApiPropertyOptional({ example: 300, description: 'Plot area size' })
  @IsNumber()
  @IsOptional()
  plotArea?: number;

  @ApiPropertyOptional({ example: 'Sq. Yd.', description: 'Plot area unit' })
  @IsString()
  @IsOptional()
  plotAreaUnit?: string;

  @ApiPropertyOptional({ example: 60, description: 'Plot dimensions length' })
  @IsNumber()
  @IsOptional()
  plotLength?: number;

  @ApiPropertyOptional({ example: 40, description: 'Plot dimensions width' })
  @IsNumber()
  @IsOptional()
  plotWidth?: number;

  @ApiPropertyOptional({ example: 'Feet', description: 'Plot dimension unit' })
  @IsString()
  @IsOptional()
  plotDimensionUnit?: string;

  @ApiPropertyOptional({
    example: 10,
    description: 'Property structural height',
  })
  @IsNumber()
  @IsOptional()
  propertyHeight?: number;

  @ApiPropertyOptional({
    example: 40,
    description: 'Property structural width',
  })
  @IsNumber()
  @IsOptional()
  propertyWidth?: number;

  @ApiPropertyOptional({
    example: 50,
    description: 'Property structural depth',
  })
  @IsNumber()
  @IsOptional()
  propertyDepth?: number;

  @ApiPropertyOptional({
    example: 'Feet',
    description: 'Property structural dimension unit',
  })
  @IsString()
  @IsOptional()
  propertyDimensionUnit?: string;

  @ApiPropertyOptional({
    example: 27500000,
    description: 'Expected pricing amount',
  })
  @IsNumber()
  @IsOptional()
  expectedPrice?: number;

  @ApiPropertyOptional({ example: 'Lumpsum', description: 'Pricing mode' })
  @IsString()
  @IsOptional()
  priceMode?: string;

  @ApiPropertyOptional({
    example: 26500000,
    description: 'Minimum negotiable price',
  })
  @IsNumber()
  @IsOptional()
  negotiableAmount?: number;

  @ApiPropertyOptional({ example: true, description: 'Is price negotiable' })
  @IsBoolean()
  @IsOptional()
  isNegotiable?: boolean;

  @ApiPropertyOptional({
    example: 5000,
    description: 'Monthly maintenance charges',
  })
  @IsNumber()
  @IsOptional()
  maintenanceCharges?: number;

  @ApiPropertyOptional({
    example: false,
    description: 'Is maintenance paid by the tenant/licensee',
  })
  @IsBoolean()
  @IsOptional()
  maintenancePaidByLicensee?: boolean;

  @ApiPropertyOptional({
    example: 100000,
    description: 'Security deposit amount',
  })
  @IsNumber()
  @IsOptional()
  securityDeposit?: number;

  @ApiPropertyOptional({
    example: true,
    description: 'Is security deposit negotiable',
  })
  @IsBoolean()
  @IsOptional()
  depositNegotiable?: boolean;

  @ApiPropertyOptional({
    example: true,
    description: 'Is security deposit refundable',
  })
  @IsBoolean()
  @IsOptional()
  depositRefundable?: boolean;

  @ApiPropertyOptional({
    example: 40,
    description: 'Joint Venture (JV) Ratio percentage',
  })
  @IsNumber()
  @IsOptional()
  jvRatio?: number;

  @ApiPropertyOptional({ example: 3, description: 'Lock-in period in years' })
  @IsNumber()
  @IsOptional()
  lockInPeriod?: number;

  @ApiPropertyOptional({ example: 5, description: 'Lease period in years' })
  @IsNumber()
  @IsOptional()
  leasePeriod?: number;

  @ApiPropertyOptional({ example: 12000, description: 'Lease hold charges' })
  @IsNumber()
  @IsOptional()
  leaseHoldCharges?: number;

  @ApiPropertyOptional({
    example: 30,
    description: 'Rent-free fitout period in days',
  })
  @IsNumber()
  @IsOptional()
  rentFreePeriod?: number;

  @ApiPropertyOptional({
    example: true,
    description: 'Is commission payable during the lock-in period',
  })
  @IsBoolean()
  @IsOptional()
  commissionPayableInLockIn?: boolean;

  @ApiPropertyOptional({
    example: 75000,
    description: 'Rent payable per month',
  })
  @IsNumber()
  @IsOptional()
  rentPerMonth?: number;

  @ApiPropertyOptional({
    example: '2026-07-01',
    description: 'Rent payment start date',
  })
  @IsString()
  @IsOptional()
  rentStartDate?: string;

  @ApiPropertyOptional({
    example: 5,
    description: 'Rent escalation percentage rate',
  })
  @IsNumber()
  @IsOptional()
  rentEscalationPercentage?: number;

  @ApiPropertyOptional({
    example: 1,
    description: 'Interval in years for rent escalation',
  })
  @IsNumber()
  @IsOptional()
  rentEscalationYears?: number;

  @ApiPropertyOptional({
    example: 7.5,
    description: 'Return on Investment (ROI) rate',
  })
  @IsNumber()
  @IsOptional()
  roi?: number;

  @ApiPropertyOptional({
    example: 'Inclusive',
    description: 'Property tax details',
  })
  @IsString()
  @IsOptional()
  propertyTax?: string;

  // ==========================================
  // Step 5: Other Details
  // ==========================================
  @ApiPropertyOptional({
    example: 2,
    description: 'Number of master bedrooms',
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  masterBedroom?: number;

  @ApiPropertyOptional({
    example: 1,
    description: 'Number of guest bedrooms',
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  guestRoom?: number;

  @ApiPropertyOptional({
    example: 1,
    description: 'Number of children rooms',
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  childRoom?: number;

  @ApiPropertyOptional({ example: 2, description: 'Number of bathrooms' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  bathroom?: number;

  @ApiPropertyOptional({ example: 1, description: 'Number of common bathrooms' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  bathroomCommon?: number;

  @ApiPropertyOptional({
    example: 1,
    description: 'Number of attached/ensuite bathrooms',
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  bathroomAttach?: number;

  @ApiPropertyOptional({
    example: 'Study Room',
    description: 'Details of any other rooms',
  })
  @IsString()
  @IsOptional()
  otherRoom?: string;

  @ApiPropertyOptional({
    example: 12,
    description: 'Total floors in the building structure',
  })
  @IsNumber()
  @IsOptional()
  totalFloor?: number;

  @ApiPropertyOptional({
    example: '12th Floor',
    description: 'Floor number this specific property resides on',
  })
  @IsString()
  @IsOptional()
  propertyOnFloor?: string;

  @ApiPropertyOptional({
    example: 'Vitrified Tiles',
    description: 'Type of flooring',
  })
  @IsString()
  @IsOptional()
  flooring?: string;

  @ApiPropertyOptional({
    example: 2,
    description: 'Number of parking spaces available',
  })
  @IsNumber()
  @IsOptional()
  noOfParking?: number;

  @ApiPropertyOptional({
    example: 'Covered',
    description: 'Parking type layout configuration',
  })
  @IsString()
  @IsOptional()
  parkingType?: string;

  @ApiPropertyOptional({
    example: 'East',
    description: 'Vastu facing direction',
  })
  @IsString()
  @IsOptional()
  facing?: string;

  @ApiPropertyOptional({
    example: ['Swimming Pool', 'Gymnasium', '24/7 Security'],
    description: 'List of amenities',
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  amenities?: string[];

  @ApiPropertyOptional({
    example: 'Newspaper Ad',
    description: 'Marketing advertisement medium',
  })
  @IsString()
  @IsOptional()
  advertised?: string;

  @ApiPropertyOptional({
    example: '2 Years',
    description: 'Age of structural property since completion',
  })
  @IsString()
  @IsOptional()
  ageOfProperty?: string;

  @ApiPropertyOptional({
    example: 'Ready to Move',
    description: 'Construction status dropdown phase',
  })
  @IsString()
  @IsOptional()
  constructionStatus?: string;

  @ApiPropertyOptional({
    example: 'Immediate',
    description: 'Possession availability timing',
  })
  @IsString()
  @IsOptional()
  availabilityPossession?: string;

  @ApiPropertyOptional({
    example: '2026-06-15',
    description: 'Possession handover date',
  })
  @IsString()
  @IsOptional()
  possessionDate?: string;

  @ApiPropertyOptional({
    example: 25,
    description: 'Number of office workstations',
  })
  @IsNumber()
  @IsOptional()
  workStation?: number;

  @ApiPropertyOptional({
    example: 3,
    description: 'Number of manager/director cabins',
  })
  @IsNumber()
  @IsOptional()
  cabins?: number;

  @ApiPropertyOptional({
    example: 1,
    description: 'Number of dedicated conference rooms',
  })
  @IsNumber()
  @IsOptional()
  conferenceRoom?: number;

  @ApiPropertyOptional({
    example: true,
    description: 'Dedicated reception counter space',
  })
  @IsBoolean()
  @IsOptional()
  reception?: boolean;

  @ApiPropertyOptional({
    example: 15,
    description: 'Electrical power supply threshold in KVA',
  })
  @IsNumber()
  @IsOptional()
  powerKva?: number;

  @ApiPropertyOptional({
    example: true,
    description: 'Has Diesel Generator (DG) power backup',
  })
  @IsBoolean()
  @IsOptional()
  hasDgBackup?: boolean;

  @ApiPropertyOptional({
    example: 'https://youtube.com/watch?v=mock',
    description: 'Video walk-through link',
  })
  @IsString()
  @IsOptional()
  videoUrl?: string;

  @ApiPropertyOptional({
    example: 'Bandra Apartment Rent',
    description: 'SEO website keyword tags',
  })
  @IsString()
  @IsOptional()
  websiteKeyword?: string;

  @ApiPropertyOptional({
    example: 'Amber',
    description: 'Warehouse platform color coding standard',
  })
  @IsString()
  @IsOptional()
  platformColorCode?: string;

  @ApiPropertyOptional({
    example: 5,
    description: 'Tackling Capacity in metric tons (EOT Crane)',
  })
  @IsNumber()
  @IsOptional()
  tacklingCapacityEot?: number;

  @ApiPropertyOptional({
    example: 10,
    description: 'Floor structural weight capacity limit value',
  })
  @IsNumber()
  @IsOptional()
  floorStrength?: number;

  @ApiPropertyOptional({
    example: 'Tons/Sq.Mt.',
    description: 'Floor structural load capacity unit',
  })
  @IsString()
  @IsOptional()
  floorStrengthUnit?: string;

  @ApiPropertyOptional({
    example: 50,
    description: 'STP or ETP plant utility capacity',
  })
  @IsNumber()
  @IsOptional()
  stpEtpCapacity?: number;

  @ApiPropertyOptional({ example: 4, description: 'Number of washrooms' })
  @IsNumber()
  @IsOptional()
  noOfWashrooms?: number;

  @ApiPropertyOptional({ example: 12, description: 'Canopy structure length' })
  @IsNumber()
  @IsOptional()
  canopyLength?: number;

  @ApiPropertyOptional({ example: 8, description: 'Canopy structure width' })
  @IsNumber()
  @IsOptional()
  canopyWidth?: number;

  @ApiPropertyOptional({
    example: true,
    description: 'Free NOC license status',
  })
  @IsBoolean()
  @IsOptional()
  freeNoc?: boolean;

  @ApiPropertyOptional({
    example: false,
    description: 'Presence of additional uploaded layout files',
  })
  @IsBoolean()
  @IsOptional()
  additionalFiles?: boolean;

  @ApiPropertyOptional({
    example: true,
    description: 'Presence of dock levellers machinery',
  })
  @IsBoolean()
  @IsOptional()
  dockLevellers?: boolean;

  // ==========================================
  // Media / Photos / Images
  // ==========================================
  @ApiPropertyOptional({
    example: [
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c',
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9',
    ],
    description: 'Array of property photo URLs or base64 data URIs',
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  @Transform(({ value }) => (Array.isArray(value) ? value : value ? [value] : []))
  photos?: string[];

  @ApiPropertyOptional({
    example: [
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c',
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9',
    ],
    description: 'Array of property image URLs or base64 data URIs',
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  @Transform(({ value }) => (Array.isArray(value) ? value : value ? [value] : []))
  images?: string[];

  // ==========================================
  // Step 6: Save and Publish
  // ==========================================
  @ApiPropertyOptional({
    example: 'Bandra West 3 BHK Luxury Rent',
    description: 'Listing search keyword',
  })
  @IsString()
  @IsOptional()
  keyword?: string;

  @ApiPropertyOptional({
    example: 'Agent network',
    description: 'Referral agent source',
  })
  @IsString()
  @IsOptional()
  referBy?: string;

  @ApiPropertyOptional({
    example: 'Owner',
    description: 'Property key holder entity',
  })
  @IsString()
  @IsOptional()
  keyHolder?: string;

  @ApiPropertyOptional({ example: 'Broker', description: 'Secondary holder' })
  @IsString()
  @IsOptional()
  holder?: string;

  @ApiPropertyOptional({
    example: 'Campaigns',
    description: 'Lead generation source',
  })
  @IsString()
  @IsOptional()
  source?: string;

  @ApiPropertyOptional({
    example: 'Hot',
    description: 'Deal hotness classification level',
  })
  @IsString()
  @IsOptional()
  hotness?: string;

  @ApiPropertyOptional({
    example: 'Alex Mercer',
    description: 'Assignee staff name/ID',
  })
  @IsString()
  @IsOptional()
  assignee?: string;

  @ApiPropertyOptional({
    example: true,
    description: 'Featured banner premium priority listing status',
  })
  @IsBoolean()
  @IsOptional()
  featured?: boolean;

  @ApiPropertyOptional({
    example: true,
    description: 'Auto dispatch WhatsApp copy alert to employee assignee',
  })
  @IsBoolean()
  @IsOptional()
  sendWhatsAppToAssignee?: boolean;

  @ApiPropertyOptional({
    example: true,
    description: 'Auto dispatch WhatsApp flyer to customer',
  })
  @IsBoolean()
  @IsOptional()
  sendWhatsAppToCustomer?: boolean;

  @ApiPropertyOptional({
    example: true,
    description: 'Auto dispatch Email alert copy to employee assignee',
  })
  @IsBoolean()
  @IsOptional()
  sendEmailToAssignee?: boolean;

  @ApiPropertyOptional({
    example: true,
    description: 'Auto dispatch Email summary brochure to customer',
  })
  @IsBoolean()
  @IsOptional()
  sendEmailToCustomer?: boolean;

  @ApiPropertyOptional({
    example: 'Shared',
    description: 'Privacy visibility: Private or Shared',
  })
  @IsString()
  @IsOptional()
  privacy?: string;

  @ApiPropertyOptional({
    example: false,
    description: 'Hide specific contact numbers from lists',
  })
  @IsBoolean()
  @IsOptional()
  hideContactNumber?: boolean;
}
