import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PropertyStatus } from '../schemas/property.schema';

export class PropertyResponseDto {
  @ApiProperty({
    example: '60d5ed7ab394142e88a38c29',
    description: 'Property unique database identifier ID',
  })
  id: string;

  // ==========================================
  // Ownership / Assignment References
  // ==========================================
  @ApiPropertyOptional({
    description: 'User profile who registered the listing',
  })
  createdBy?: any;

  @ApiPropertyOptional({ description: 'Assigned User profile details' })
  assignedTo?: any;

  // ==========================================
  // Legacy / Base Fields (Compatible Mode)
  // ==========================================
  @ApiPropertyOptional({
    example: 'Greenwood Luxury Residency',
    description: 'Name of the property project',
  })
  name?: string;

  @ApiPropertyOptional({
    example: 'Bandra West, Mumbai',
    description: 'Geographical location',
  })
  location?: string;

  @ApiPropertyOptional({
    example: '3 BHK Premium Apartment',
    description: 'Configuration or description of unit layout',
  })
  type?: string;

  @ApiPropertyOptional({
    example: '₹2.75 Cr',
    description: 'Price display value',
  })
  price?: string;

  @ApiPropertyOptional({
    example: 1850,
    description: 'Total build-up size in square feet',
  })
  sqft?: number;

  @ApiPropertyOptional({
    example: 'Available',
    enum: PropertyStatus,
    description: 'Sales availability status',
  })
  status?: PropertyStatus;

  @ApiPropertyOptional({
    example: 'Greenwood Infra Corp',
    description: 'Builder or developer branding name',
  })
  builder?: string;

  // ==========================================
  // Step 1: Contact Information
  // ==========================================
  @ApiPropertyOptional({
    example: 'John Doe',
    description: 'Owner or Landlord name/ID',
  })
  ownerLandlord?: string;

  // ==========================================
  // Step 2: Basic Information
  // ==========================================
  @ApiPropertyOptional({ example: '2026-06-01', description: 'Request Date' })
  requestDate?: string;

  @ApiPropertyOptional({ example: 'Self', description: 'FO (Field Officer)' })
  fo?: string;

  @ApiPropertyOptional({
    example: 'Residential',
    description: 'Property type dropdown value',
  })
  propertyType?: string;

  @ApiPropertyOptional({
    example: 'Residential',
    description: 'Property category (e.g. Residential, Commercial, etc.)',
  })
  category?: string;

  @ApiPropertyOptional({ example: 'Rent', description: 'Transaction type' })
  transaction?: string;

  @ApiPropertyOptional({
    example: 'Freehold',
    description: 'Ownership details',
  })
  ownership?: string;

  @ApiPropertyOptional({
    example: '3 BHK',
    description: 'Number of bedrooms configuration',
  })
  bedroom?: string;

  @ApiPropertyOptional({
    example: 'Fully Furnished',
    description: 'Furnishing status',
  })
  furnishing?: string;

  @ApiPropertyOptional({
    example: 'Family',
    description: 'Suitable for target customers',
  })
  suitableFor?: string;

  @ApiPropertyOptional({
    example: 'Sea View',
    description: 'Unique premium feature',
  })
  uniqueFeature?: string;

  @ApiPropertyOptional({
    example: 'Direct Client',
    description: 'Acquisition channel',
  })
  channel?: string;

  @ApiPropertyOptional({
    example: 'Premium duplex apartment with modern amenities.',
    description: 'Long description',
  })
  description?: string;

  @ApiPropertyOptional({
    example: 'Highly motivated owner.',
    description: 'General remarks',
  })
  remark?: string;

  @ApiPropertyOptional({
    example: 'Verify original papers before closing.',
    description: 'Internal team notes',
  })
  internalNote?: string;

  @ApiPropertyOptional({
    example: true,
    description: 'Whether property documents are verified',
  })
  verifiedDocuments?: boolean;

  @ApiPropertyOptional({
    example: true,
    description: 'Whether physical property visit is completed',
  })
  completedVisit?: boolean;

  // ==========================================
  // Step 3: Location Details
  // ==========================================
  @ApiPropertyOptional({
    example: 19.076,
    description: 'Map Latitude coordinate',
  })
  latitude?: number;

  @ApiPropertyOptional({
    example: 72.877,
    description: 'Map Longitude coordinate',
  })
  longitude?: number;

  @ApiPropertyOptional({
    example: 'Carter Road, Bandra West',
    description: 'Street address',
  })
  address?: string;

  @ApiPropertyOptional({
    example: 'Flat 1202',
    description: 'Flat or Office unit number',
  })
  flatOfficeUnitNo?: string;

  @ApiPropertyOptional({
    example: 'SV-991',
    description: 'Survey or plot number',
  })
  surveyNumber?: string;

  @ApiPropertyOptional({
    example: 'Carter Survey Area',
    description: 'Survey registry name',
  })
  surveyName?: string;

  @ApiPropertyOptional({
    example: 'Skyline Residency',
    description: 'Project or developer brand',
  })
  projectDeveloperName?: string;

  @ApiPropertyOptional({
    example: 'Tower A',
    description: 'Specific building block or tower name',
  })
  buildingTowerProject?: string;

  @ApiPropertyOptional({
    example: 'Main Carter Road',
    description: 'Street name',
  })
  street?: string;

  @ApiPropertyOptional({
    example: 'Near Otters Club',
    description: 'Local landmark',
  })
  landmark?: string;

  @ApiPropertyOptional({ example: '400050', description: 'Zip/Pin code' })
  pincode?: string;

  @ApiPropertyOptional({ example: 'Mumbai', description: 'City name' })
  city?: string;

  @ApiPropertyOptional({
    example: 'Bandra West',
    description: 'Locality/neighborhood name',
  })
  locality?: string;

  // ==========================================
  // Step 4: Area and Pricing
  // ==========================================
  @ApiPropertyOptional({
    example: 1500,
    description: 'Primary size/area value',
  })
  area?: number;

  @ApiPropertyOptional({
    example: 'Sq. Ft.',
    description: 'Area measurement unit',
  })
  areaUnit?: string;

  @ApiPropertyOptional({ example: 1800, description: 'Built-up area size' })
  builtUpArea?: number;

  @ApiPropertyOptional({
    example: 'Sq. Ft.',
    description: 'Built-up area unit',
  })
  builtUpAreaUnit?: string;

  @ApiPropertyOptional({ example: 1400, description: 'Carpet area size' })
  carpetArea?: number;

  @ApiPropertyOptional({ example: 'Sq. Ft.', description: 'Carpet area unit' })
  carpetAreaUnit?: string;

  @ApiPropertyOptional({ example: 200, description: 'Terrace area size' })
  terraceArea?: number;

  @ApiPropertyOptional({ example: 'Sq. Ft.', description: 'Terrace area unit' })
  terraceAreaUnit?: string;

  @ApiPropertyOptional({ example: 1600, description: 'Area range' })
  areaRange?: number;

  @ApiPropertyOptional({ example: 'Sq. Ft.', description: 'Area range unit' })
  areaRangeUnit?: string;

  @ApiPropertyOptional({ example: 300, description: 'Plot area size' })
  plotArea?: number;

  @ApiPropertyOptional({ example: 'Sq. Yd.', description: 'Plot area unit' })
  plotAreaUnit?: string;

  @ApiPropertyOptional({ example: 60, description: 'Plot dimensions length' })
  plotLength?: number;

  @ApiPropertyOptional({ example: 40, description: 'Plot dimensions width' })
  plotWidth?: number;

  @ApiPropertyOptional({ example: 'Feet', description: 'Plot dimension unit' })
  plotDimensionUnit?: string;

  @ApiPropertyOptional({
    example: 10,
    description: 'Property structural height',
  })
  propertyHeight?: number;

  @ApiPropertyOptional({
    example: 40,
    description: 'Property structural width',
  })
  propertyWidth?: number;

  @ApiPropertyOptional({
    example: 50,
    description: 'Property structural depth',
  })
  propertyDepth?: number;

  @ApiPropertyOptional({
    example: 'Feet',
    description: 'Property structural dimension unit',
  })
  propertyDimensionUnit?: string;

  @ApiPropertyOptional({
    example: 27500000,
    description: 'Expected pricing amount',
  })
  expectedPrice?: number;

  @ApiPropertyOptional({ example: 'Lumpsum', description: 'Pricing mode' })
  priceMode?: string;

  @ApiPropertyOptional({
    example: 26500000,
    description: 'Minimum negotiable price',
  })
  negotiableAmount?: number;

  @ApiPropertyOptional({ example: true, description: 'Is price negotiable' })
  isNegotiable?: boolean;

  @ApiPropertyOptional({
    example: 5000,
    description: 'Monthly maintenance charges',
  })
  maintenanceCharges?: number;

  @ApiPropertyOptional({
    example: false,
    description: 'Is maintenance paid by tenant',
  })
  maintenancePaidByLicensee?: boolean;

  @ApiPropertyOptional({
    example: 100000,
    description: 'Security deposit amount',
  })
  securityDeposit?: number;

  @ApiPropertyOptional({
    example: true,
    description: 'Is security deposit negotiable',
  })
  depositNegotiable?: boolean;

  @ApiPropertyOptional({
    example: true,
    description: 'Is security deposit refundable',
  })
  depositRefundable?: boolean;

  @ApiPropertyOptional({
    example: 40,
    description: 'Joint Venture (JV) Ratio percentage',
  })
  jvRatio?: number;

  @ApiPropertyOptional({ example: 3, description: 'Lock-in period in years' })
  lockInPeriod?: number;

  @ApiPropertyOptional({ example: 5, description: 'Lease period in years' })
  leasePeriod?: number;

  @ApiPropertyOptional({ example: 12000, description: 'Lease hold charges' })
  leaseHoldCharges?: number;

  @ApiPropertyOptional({
    example: 30,
    description: 'Rent-free fitout period in days',
  })
  rentFreePeriod?: number;

  @ApiPropertyOptional({
    example: true,
    description: 'Is commission payable during lock-in period',
  })
  commissionPayableInLockIn?: boolean;

  @ApiPropertyOptional({
    example: 75000,
    description: 'Rent payable per month',
  })
  rentPerMonth?: number;

  @ApiPropertyOptional({
    example: '2026-07-01',
    description: 'Rent payment start date',
  })
  rentStartDate?: string;

  @ApiPropertyOptional({
    example: 5,
    description: 'Rent escalation percentage rate',
  })
  rentEscalationPercentage?: number;

  @ApiPropertyOptional({
    example: 1,
    description: 'Interval in years for rent escalation',
  })
  rentEscalationYears?: number;

  @ApiPropertyOptional({
    example: 7.5,
    description: 'Return on Investment (ROI) rate',
  })
  roi?: number;

  @ApiPropertyOptional({
    example: 'Inclusive',
    description: 'Property tax details',
  })
  propertyTax?: string;

  // ==========================================
  // Step 5: Other Details
  // ==========================================
  @ApiPropertyOptional({
    example: 2,
    description: 'Number of master bedrooms',
  })
  masterBedroom?: number;

  @ApiPropertyOptional({
    example: 1,
    description: 'Number of guest bedrooms',
  })
  guestRoom?: number;

  @ApiPropertyOptional({
    example: 1,
    description: 'Number of children rooms',
  })
  childRoom?: number;

  @ApiPropertyOptional({ example: 2, description: 'Number of bathrooms' })
  bathroom?: number;

  @ApiPropertyOptional({ example: 1, description: 'Number of common bathrooms' })
  bathroomCommon?: number;

  @ApiPropertyOptional({
    example: 1,
    description: 'Number of attached/ensuite bathrooms',
  })
  bathroomAttach?: number;

  @ApiPropertyOptional({
    example: 'Study Room',
    description: 'Details of any other rooms',
  })
  otherRoom?: string;

  @ApiPropertyOptional({ example: 12, description: 'Total floors in building' })
  totalFloor?: number;

  @ApiPropertyOptional({
    example: '12th Floor',
    description: 'Floor number this specific property resides on',
  })
  propertyOnFloor?: string;

  @ApiPropertyOptional({
    example: 'Vitrified Tiles',
    description: 'Type of flooring',
  })
  flooring?: string;

  @ApiPropertyOptional({
    example: 2,
    description: 'Number of parking spaces available',
  })
  noOfParking?: number;

  @ApiPropertyOptional({
    example: 'Covered',
    description: 'Parking type layout configuration',
  })
  parkingType?: string;

  @ApiPropertyOptional({
    example: 'East',
    description: 'Vastu facing direction',
  })
  facing?: string;

  @ApiPropertyOptional({
    example: ['Swimming Pool', 'Gymnasium', '24/7 Security'],
    description: 'List of amenities',
  })
  amenities?: string[];

  @ApiPropertyOptional({
    example: 'Newspaper Ad',
    description: 'Marketing advertisement medium',
  })
  advertised?: string;

  @ApiPropertyOptional({
    example: '2 Years',
    description: 'Age of structural property since completion',
  })
  ageOfProperty?: string;

  @ApiPropertyOptional({
    example: 'Ready to Move',
    description: 'Construction status dropdown phase',
  })
  constructionStatus?: string;

  @ApiPropertyOptional({
    example: 'Immediate',
    description: 'Possession availability timing',
  })
  availabilityPossession?: string;

  @ApiPropertyOptional({
    example: '2026-06-15',
    description: 'Possession handover date',
  })
  possessionDate?: string;

  @ApiPropertyOptional({
    example: 25,
    description: 'Number of office workstations',
  })
  workStation?: number;

  @ApiPropertyOptional({
    example: 3,
    description: 'Number of manager/director cabins',
  })
  cabins?: number;

  @ApiPropertyOptional({
    example: 1,
    description: 'Number of dedicated conference rooms',
  })
  conferenceRoom?: number;

  @ApiPropertyOptional({
    example: true,
    description: 'Dedicated reception counter space',
  })
  reception?: boolean;

  @ApiPropertyOptional({
    example: 15,
    description: 'Electrical power supply threshold in KVA',
  })
  powerKva?: number;

  @ApiPropertyOptional({ example: true, description: 'Has DG power backup' })
  hasDgBackup?: boolean;

  @ApiPropertyOptional({
    example: 'https://youtube.com/watch?v=mock',
    description: 'Video walk-through link',
  })
  videoUrl?: string;

  @ApiPropertyOptional({
    example: 'Bandra Apartment Rent',
    description: 'SEO website keyword tags',
  })
  websiteKeyword?: string;

  @ApiPropertyOptional({
    example: 'Amber',
    description: 'Warehouse platform color coding standard',
  })
  platformColorCode?: string;

  @ApiPropertyOptional({
    example: 5,
    description: 'Tackling Capacity in metric tons (EOT Crane)',
  })
  tacklingCapacityEot?: number;

  @ApiPropertyOptional({
    example: 10,
    description: 'Floor structural weight capacity limit value',
  })
  floorStrength?: number;

  @ApiPropertyOptional({
    example: 'Tons/Sq.Mt.',
    description: 'Floor structural load capacity unit',
  })
  floorStrengthUnit?: string;

  @ApiPropertyOptional({
    example: 50,
    description: 'STP or ETP plant utility capacity',
  })
  stpEtpCapacity?: number;

  @ApiPropertyOptional({ example: 4, description: 'Number of washrooms' })
  noOfWashrooms?: number;

  @ApiPropertyOptional({ example: 12, description: 'Canopy structure length' })
  canopyLength?: number;

  @ApiPropertyOptional({ example: 8, description: 'Canopy structure width' })
  canopyWidth?: number;

  @ApiPropertyOptional({
    example: true,
    description: 'Free NOC license status',
  })
  freeNoc?: boolean;

  @ApiPropertyOptional({
    example: false,
    description: 'Presence of additional uploaded layout files',
  })
  additionalFiles?: boolean;

  @ApiPropertyOptional({
    example: true,
    description: 'Presence of dock levellers machinery',
  })
  dockLevellers?: boolean;

  // ==========================================
  // Media / Photos / Images
  // ==========================================
  @ApiPropertyOptional({
    example: [
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c',
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9',
    ],
    description: 'List of property photos',
    type: [String],
  })
  photos?: string[];

  @ApiPropertyOptional({
    example: [
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c',
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9',
    ],
    description: 'List of property images',
    type: [String],
  })
  images?: string[];

  // ==========================================
  // Step 6: Save and Publish
  // ==========================================
  @ApiPropertyOptional({
    example: 'Bandra West 3 BHK Luxury Rent',
    description: 'Listing search keyword',
  })
  keyword?: string;

  @ApiPropertyOptional({
    example: 'Agent network',
    description: 'Referral agent source',
  })
  referBy?: string;

  @ApiPropertyOptional({
    example: 'Owner',
    description: 'Property key holder entity',
  })
  keyHolder?: string;

  @ApiPropertyOptional({ example: 'Ramesh Sharma', description: 'Site Manager Name' })
  siteManager?: string;

  @ApiPropertyOptional({ example: '9876543210', description: 'Site Manager Contact Number' })
  siteManagerContact?: string;

  @ApiPropertyOptional({ example: 'Suresh Kumar', description: 'Sourcing Manager Name' })
  sourcingManager?: string;

  @ApiPropertyOptional({ example: '9876543211', description: 'Sourcing Manager Contact Number' })
  sourcingManagerContact?: string;

  @ApiPropertyOptional({ example: 'Vijay Patil', description: 'Closing Manager Name' })
  closingManager?: string;

  @ApiPropertyOptional({ example: '9876543212', description: 'Closing Manager Contact Number' })
  closingManagerContact?: string;

  @ApiPropertyOptional({ example: 'Broker', description: 'Secondary holder' })
  holder?: string;

  @ApiPropertyOptional({
    example: 'Campaigns',
    description: 'Lead generation source',
  })
  source?: string;

  @ApiPropertyOptional({
    example: 'Hot',
    description: 'Deal hotness classification level',
  })
  hotness?: string;

  @ApiPropertyOptional({
    example: 'Alex Mercer',
    description: 'Assignee staff name/ID',
  })
  assignee?: string;

  @ApiPropertyOptional({
    example: true,
    description: 'Featured banner premium priority listing status',
  })
  featured?: boolean;

  @ApiPropertyOptional({
    example: true,
    description: 'Auto dispatch WhatsApp copy alert to employee assignee',
  })
  sendWhatsAppToAssignee?: boolean;

  @ApiPropertyOptional({
    example: true,
    description: 'Auto dispatch WhatsApp flyer to customer',
  })
  sendWhatsAppToCustomer?: boolean;

  @ApiPropertyOptional({
    example: true,
    description: 'Auto dispatch Email alert copy to employee assignee',
  })
  sendEmailToAssignee?: boolean;

  @ApiPropertyOptional({
    example: true,
    description: 'Auto dispatch Email summary brochure to customer',
  })
  sendEmailToCustomer?: boolean;

  @ApiPropertyOptional({
    example: 'Shared',
    description: 'Privacy visibility: Private or Shared',
  })
  privacy?: string;

  @ApiPropertyOptional({
    example: false,
    description: 'Hide specific contact numbers from lists',
  })
  hideContactNumber?: boolean;

  @ApiProperty({
    example: '2026-05-26T14:04:03.000Z',
    description: 'Timestamp of project registration',
  })
  createdAt: string;

  @ApiProperty({
    example: '2026-05-26T14:04:03.000Z',
    description: 'Timestamp of last modification',
  })
  updatedAt: string;
}
