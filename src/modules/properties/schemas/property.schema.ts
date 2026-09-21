import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { User } from '../../users/schemas/user.schema';
import { Contact } from '../../contacts/schemas/contact.schema';

export type PropertyDocument = Property & Document;

/**
 * Enum defining available statuses for real-estate properties.
 * Matches frontend CRM expectations for listing availability stages.
 */
export enum PropertyStatus {
  AVAILABLE = 'Available',
  SOLD_OUT = 'Sold Out',
  UNDER_CONSTRUCTION = 'Under Construction',
}

@Schema({
  timestamps: true,
  strict: false,
  toJSON: {
    transform: (doc, ret: any) => {
      /* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-return */
      ret.id = ret._id.toString();
      delete ret._id;
      delete ret.__v;
      return ret;
      /* eslint-enable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-return */
    },
  },
})
export class Property {
  // ==========================================
  // Ownership / Assignment References
  // ==========================================
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'User',
    required: false,
    index: true,
  })
  createdBy?: User;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'User',
    required: false,
    index: true,
  })
  assignedTo?: User;

  // ==========================================
  // Legacy / Base Fields (Compatible Mode)
  // ==========================================
  @Prop({ required: false, trim: true })
  name?: string;

  @Prop({ required: false, trim: true })
  location?: string;

  @Prop({ required: false, trim: true })
  type?: string;

  @Prop({ required: false, trim: true })
  price?: string;

  @Prop({ required: false, type: Number })
  sqft?: number;

  @Prop({
    required: false,
    enum: PropertyStatus,
    default: PropertyStatus.AVAILABLE,
    index: true,
  })
  status?: PropertyStatus;

  @Prop({ required: false, trim: true })
  builder?: string;

  // ==========================================
  // Step 1: Contact Information
  // ==========================================
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Contact',
    required: false,
    index: true,
  })
  ownerLandlord?: Contact;

  // ==========================================
  // Step 2: Basic Information
  // ==========================================
  @Prop({ required: false, trim: true })
  requestDate?: string;

  @Prop({ required: false, trim: true })
  fo?: string;

  @Prop({ required: false, trim: true })
  propertyType?: string;

  @Prop({ required: false, trim: true })
  category?: string;

  @Prop({ required: false, trim: true })
  transaction?: string;

  @Prop({ required: false, trim: true })
  ownership?: string;

  @Prop({ required: false, trim: true })
  bedroom?: string;

  @Prop({ required: false, trim: true })
  furnishing?: string;

  @Prop({ required: false, trim: true })
  suitableFor?: string;

  @Prop({ required: false, trim: true })
  uniqueFeature?: string;

  @Prop({ required: false, trim: true })
  channel?: string;

  @Prop({ required: false, trim: true })
  description?: string;

  @Prop({ required: false, trim: true })
  remark?: string;

  @Prop({ required: false, trim: true })
  internalNote?: string;

  @Prop({ required: false, type: Boolean, default: false })
  verifiedDocuments?: boolean;

  @Prop({ required: false, type: Boolean, default: false })
  completedVisit?: boolean;

  // ==========================================
  // Step 3: Location Details
  // ==========================================
  @Prop({ required: false, type: Number })
  latitude?: number;

  @Prop({ required: false, type: Number })
  longitude?: number;

  @Prop({ required: false, trim: true })
  address?: string;

  @Prop({ required: false, trim: true })
  flatOfficeUnitNo?: string;

  @Prop({ required: false, trim: true })
  surveyNumber?: string;

  @Prop({ required: false, trim: true })
  surveyName?: string;

  @Prop({ required: false, trim: true })
  projectDeveloperName?: string;

  @Prop({ required: false, trim: true })
  buildingTowerProject?: string;

  @Prop({ required: false, trim: true })
  street?: string;

  @Prop({ required: false, trim: true })
  landmark?: string;

  @Prop({ required: false, trim: true })
  pincode?: string;

  @Prop({ required: false, trim: true })
  city?: string;

  @Prop({ required: false, trim: true })
  locality?: string;

  // ==========================================
  // Step 4: Area and Pricing
  // ==========================================
  @Prop({ required: false, type: Number })
  area?: number;

  @Prop({ required: false, trim: true })
  areaUnit?: string;

  @Prop({ required: false, type: Number })
  builtUpArea?: number;

  @Prop({ required: false, trim: true })
  builtUpAreaUnit?: string;

  @Prop({ required: false, type: Number })
  carpetArea?: number;

  @Prop({ required: false, trim: true })
  carpetAreaUnit?: string;

  @Prop({ required: false, type: Number })
  terraceArea?: number;

  @Prop({ required: false, trim: true })
  terraceAreaUnit?: string;

  @Prop({ required: false, type: Number })
  areaRange?: number;

  @Prop({ required: false, trim: true })
  areaRangeUnit?: string;

  @Prop({ required: false, type: Number })
  plotArea?: number;

  @Prop({ required: false, trim: true })
  plotAreaUnit?: string;

  @Prop({ required: false, type: Number })
  plotLength?: number;

  @Prop({ required: false, type: Number })
  plotWidth?: number;

  @Prop({ required: false, trim: true })
  plotDimensionUnit?: string;

  @Prop({ required: false, type: Number })
  propertyHeight?: number;

  @Prop({ required: false, type: Number })
  propertyWidth?: number;

  @Prop({ required: false, type: Number })
  propertyDepth?: number;

  @Prop({ required: false, trim: true })
  propertyDimensionUnit?: string;

  @Prop({ required: false, type: Number })
  expectedPrice?: number;

  @Prop({ required: false, trim: true })
  priceMode?: string;

  @Prop({ required: false, type: Number })
  negotiableAmount?: number;

  @Prop({ required: false, type: Boolean, default: false })
  isNegotiable?: boolean;

  @Prop({ required: false, type: Number })
  maintenanceCharges?: number;

  @Prop({ required: false, type: Boolean, default: false })
  maintenancePaidByLicensee?: boolean;

  @Prop({ required: false, type: Number })
  securityDeposit?: number;

  @Prop({ required: false, type: Boolean, default: false })
  depositNegotiable?: boolean;

  @Prop({ required: false, type: Boolean, default: false })
  depositRefundable?: boolean;

  @Prop({ required: false, type: Number })
  jvRatio?: number;

  @Prop({ required: false, type: Number })
  lockInPeriod?: number;

  @Prop({ required: false, type: Number })
  leasePeriod?: number;

  @Prop({ required: false, type: Number })
  leaseHoldCharges?: number;

  @Prop({ required: false, type: Number })
  rentFreePeriod?: number;

  @Prop({ required: false, type: Boolean, default: false })
  commissionPayableInLockIn?: boolean;

  @Prop({ required: false, type: Number })
  rentPerMonth?: number;

  @Prop({ required: false, trim: true })
  rentStartDate?: string;

  @Prop({ required: false, type: Number })
  rentEscalationPercentage?: number;

  @Prop({ required: false, type: Number })
  rentEscalationYears?: number;

  @Prop({ required: false, type: Number })
  roi?: number;

  @Prop({ required: false, trim: true })
  propertyTax?: string;

  // ==========================================
  // Step 5: Other Details
  // ==========================================
  @Prop({ required: false, type: Number })
  masterBedroom?: number;

  @Prop({ required: false, type: Number })
  guestRoom?: number;

  @Prop({ required: false, type: Number })
  childRoom?: number;

  @Prop({ required: false, type: Number })
  bathroom?: number;

  @Prop({ required: false, type: Number })
  bathroomCommon?: number;

  @Prop({ required: false, type: Number })
  bathroomAttach?: number;

  @Prop({ required: false, trim: true })
  otherRoom?: string;

  @Prop({ required: false, type: Number })
  totalFloor?: number;

  @Prop({ required: false, trim: true })
  propertyOnFloor?: string;

  @Prop({ required: false, trim: true })
  flooring?: string;

  @Prop({ required: false, type: Number })
  noOfParking?: number;

  @Prop({ required: false, trim: true })
  parkingType?: string;

  @Prop({ required: false, trim: true })
  facing?: string;

  @Prop({ required: false, type: [String], default: [] })
  amenities?: string[];

  @Prop({ required: false, trim: true })
  advertised?: string;

  @Prop({ required: false, trim: true })
  ageOfProperty?: string;

  @Prop({ required: false, trim: true })
  constructionStatus?: string;

  @Prop({ required: false, trim: true })
  availabilityPossession?: string;

  @Prop({ required: false, trim: true })
  possessionDate?: string;

  @Prop({ required: false, type: Number })
  workStation?: number;

  @Prop({ required: false, type: Number })
  cabins?: number;

  @Prop({ required: false, type: Number })
  conferenceRoom?: number;

  @Prop({ required: false, type: Boolean, default: false })
  reception?: boolean;

  @Prop({ required: false, type: Number })
  powerKva?: number;

  @Prop({ required: false, type: Boolean, default: false })
  hasDgBackup?: boolean;

  @Prop({ required: false, trim: true })
  videoUrl?: string;

  @Prop({ required: false, trim: true })
  websiteKeyword?: string;

  @Prop({ required: false, trim: true })
  platformColorCode?: string;

  @Prop({ required: false, type: Number })
  tacklingCapacityEot?: number;

  @Prop({ required: false, type: Number })
  floorStrength?: number;

  @Prop({ required: false, trim: true })
  floorStrengthUnit?: string;

  @Prop({ required: false, type: Number })
  stpEtpCapacity?: number;

  @Prop({ required: false, type: Number })
  noOfWashrooms?: number;

  @Prop({ required: false, type: Number })
  canopyLength?: number;

  @Prop({ required: false, type: Number })
  canopyWidth?: number;

  @Prop({ required: false, type: Boolean, default: false })
  freeNoc?: boolean;

  @Prop({ required: false, type: Boolean, default: false })
  additionalFiles?: boolean;

  @Prop({ required: false, type: Boolean, default: false })
  dockLevellers?: boolean;

  // ==========================================
  // Media / Photos / Images
  // ==========================================
  @Prop({ required: false, type: [String], default: [] })
  photos?: string[];

  @Prop({ required: false, type: [String], default: [] })
  images?: string[];

  // ==========================================
  // Step 6: Save and Publish
  // ==========================================
  @Prop({ required: false, trim: true })
  keyword?: string;

  @Prop({ required: false, trim: true })
  referBy?: string;

  @Prop({ required: false, trim: true })
  keyHolder?: string;

  @Prop({ required: false, trim: true })
  siteManager?: string;

  @Prop({ required: false, trim: true })
  siteManagerContact?: string;

  @Prop({ required: false, trim: true })
  sourcingManager?: string;

  @Prop({ required: false, trim: true })
  sourcingManagerContact?: string;

  @Prop({ required: false, trim: true })
  closingManager?: string;

  @Prop({ required: false, trim: true })
  closingManagerContact?: string;

  @Prop({ required: false, trim: true })
  holder?: string;

  @Prop({ required: false, trim: true })
  source?: string;

  @Prop({ required: false, trim: true })
  hotness?: string;

  @Prop({ required: false, trim: true })
  assignee?: string;

  @Prop({ required: false, type: Boolean, default: false })
  featured?: boolean;

  @Prop({ required: false, type: Boolean, default: false })
  sendWhatsAppToAssignee?: boolean;

  @Prop({ required: false, type: Boolean, default: false })
  sendWhatsAppToCustomer?: boolean;

  @Prop({ required: false, type: Boolean, default: false })
  sendEmailToAssignee?: boolean;

  @Prop({ required: false, type: Boolean, default: false })
  sendEmailToCustomer?: boolean;

  @Prop({ required: false, trim: true })
  privacy?: string;

  @Prop({ required: false, type: Boolean, default: false })
  hideContactNumber?: boolean;

  @Prop({ required: false, trim: true })
  virtualVideoUrl?: string;

  @Prop({ required: false, type: [Object], default: [] })
  videos?: Record<string, any>[];

  @Prop({ required: false, type: [String], default: [] })
  keywords?: string[];

  @Prop({ required: false, type: [Object], default: [] })
  documents?: Record<string, any>[];
}

export const PropertySchema = SchemaFactory.createForClass(Property);
