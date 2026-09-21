import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

import { Document, Schema as MongooseSchema } from 'mongoose';

import { User } from '../../users/schemas/user.schema';

import { Contact } from '../../contacts/schemas/contact.schema';

export type OpportunityDocument = Opportunity & Document;

export enum OpportunityStatus {
  IN_PROGRESS = 'In Progress',

  WON = 'Won',

  LOST = 'Lost',
}

export enum OpportunityVisibility {
  PRIVATE = 'Private',

  BRANCH = 'Branch',
}

export enum OpportunityPurpose {
  BUY = 'Buy',

  PG = 'PG',

  RENT_LEASE = 'Rent/Lease',

  RE_DEVELOPMENT = 'Re-Development',

  JOINT_VENTURES = 'Joint Ventures',

  SERVICES = 'Services',
}

export enum OpportunityLookingFor {
  RESIDENTIAL = 'Residential',

  RESIDENTIAL_APARTMENT = 'Residential Apartment',

  RESIDENTIAL_VILLA = 'Residential Independent House / Villa',

  RESIDENTIAL_BUILDER_FLOOR = 'Residential Independent / Builder Floor',

  RESIDENTIAL_STUDIO = 'Residential Studio Apartment',

  RESIDENTIAL_FARM = 'Residential Farm House',
}

export enum OpportunityAreaUnit {
  SQ_FT = 'Sq.Ft.',

  SQ_METER = 'Sq.Meter',

  GROUNDS = 'Grounds',

  AANKADAM = 'Aankadam',

  ROOD = 'Rood',
}

export enum OpportunityBedroom {
  RK_1 = '1 RK',

  BHK_1 = '1 BHK',

  BHK_1_5 = '1.5 BHK',

  BHK_2 = '2 BHK',

  BHK_2_5 = '2.5 BHK',

  BHK_3 = '3 BHK',

  BHK_3_5 = '3.5 BHK',

  BHK_4 = '4 BHK',

  BHK_4_PLUS = '4+ BHK',
}

export enum OpportunityFurnishing {
  FULLY_FURNISHED = 'Fully Furnished',

  UNFURNISHED = 'UnFurnished',

  SEMI_FURNISHED = 'Semi Furnished',

  READY_TO_FURNISH = 'Ready to Furnished',

  BARESHELL = 'Bareshell',
}

@Schema({
  timestamps: true,

  toJSON: {
    transform: (doc, ret: any) => {
      ret.id = ret._id.toString();

      delete ret._id;

      delete ret.__v;

      return ret;
    },
  },
})
export class Opportunity {
  // ==========================================
  // 1. Contact Information (Step 1)
  // ==========================================

  @Prop({
    type: MongooseSchema.Types.ObjectId,

    ref: 'Contact',

    required: true,

    index: true,
  })
  contactId: Contact; // Labeled "Customer*"

  // ==========================================
  // 2. Basic Requirement (Step 2)
  // ==========================================

  @Prop({
    required: true,
    trim: true,
  })
  requestDate: string; // Labeled "Request Date" (e.g. "20-May-2026")

  @Prop({
    trim: true,
  })
  estCloseDate?: string; // Labeled "Est. Close Date" (e.g. "20-May-2026")

  @Prop({
    required: true,
    enum: OpportunityPurpose,
    index: true,
  })
  purpose: OpportunityPurpose; // Labeled "For*" (e.g. "Buy", "Rent/Lease")

  @Prop({
    required: true,
    trim: true,
    index: true,
  })
  lookingFor: string; // Labeled "Looking For*" (e.g. "Residential Apartment")

  @Prop({
    type: Number,
    required: true,
  })
  minBudget: number; // Labeled "Budget*" (min)

  @Prop({
    type: Number,
    required: true,
  })
  maxBudget: number; // Labeled "Budget*" (max)

  @Prop({
    required: true,
    trim: true,
  })
  budgetUnit: string; // Labeled "Budget*" (unit, e.g. "Lacs", "Crore")

  @Prop({
    type: Number,
    required: true,
  })
  minArea: number; // Labeled "Area*" (min)

  @Prop({
    type: Number,
    required: true,
  })
  maxArea: number; // Labeled "Area*" (max)

  @Prop({
    required: true,
    enum: OpportunityAreaUnit,
  })
  areaUnit: OpportunityAreaUnit; // Labeled "Area*" (unit, e.g. "Sq.Ft.", "Sq.Meter")

  @Prop({
    required: true,
    trim: true,
    index: true,
  })
  city: string; // Labeled "City*"

  @Prop({
    required: true,
    trim: true,
    index: true,
  })
  locality: string; // Labeled "Locality*"

  @Prop({
    trim: true,
    index: true,
  })
  bedroom?: string; // Labeled "Bedroom" (e.g. "1 BHK", "2 BHK")

  @Prop({
    enum: OpportunityFurnishing,
    index: true,
  })
  furnishing?: OpportunityFurnishing; // Labeled "Furnishing" (e.g. "Fully Furnished")

  @Prop({
    trim: true,
  })
  transaction?: string; // Labeled "Transaction"

  @Prop({
    trim: true,
  })
  purposePref?: string; // Labeled "Purpose/Preferences"

  @Prop({
    trim: true,
  })
  propertyAge?: string; // Labeled "Property Age"

  @Prop({
    trim: true,
  })
  description?: string; // Labeled "Description" (max 2000 chars)

  @Prop({
    trim: true,
  })
  internalNote?: string; // Labeled "Internal Note" (max 2000 chars)

  // ==========================================
  // 3. Schedule (Step 3)
  // ==========================================

  @Prop({
    required: true,
    trim: true,
  })
  schedulePurpose: string; // Labeled "Purpose/Stage*"

  @Prop({
    trim: true,
  })
  scheduleRemark?: string; // Labeled "Remark"

  @Prop({
    required: true,
    trim: true,
  })
  scheduleDate: string; // Labeled "Schedule Date*"

  @Prop({
    required: true,
    trim: true,
  })
  scheduleTime: string; // Labeled "Schedule Time*"

  @Prop({
    trim: true,
  })
  scheduleWhere?: string; // Labeled "Where"

  // ==========================================
  // 4. Save and Publish (Step 4)
  // ==========================================

  @Prop({
    type: String,
    trim: true,
  })
  keyword?: string; // Labeled "Keyword"

  @Prop({
    trim: true,
  })
  referBy?: string; // Labeled "Refer By"

  @Prop({
    trim: true,
  })
  folder?: string; // Labeled "Folder"

  @Prop({
    required: true,
    trim: true,
    index: true,
  })
  source: string; // Labeled "Source*"

  @Prop({
    required: true,
    trim: true,
    index: true,
  })
  branch: string; // Labeled "Branch*"

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'User',
    required: false,
    index: true,
  })
  assignedTo?: User; // Labeled "Assignee*"

  @Prop({
    type: Number,
    default: 0,
  })
  estRevenue: number; // Labeled "Est. Revenue"

  @Prop({
    type: Boolean,
    default: false,
  })
  sendWhatsAppToAssignee: boolean;

  @Prop({
    type: Boolean,
    default: false,
  })
  sendEmailToAssignee: boolean;

  @Prop({
    type: Boolean,
    default: false,
  })
  sendWhatsAppToCustomer: boolean;

  @Prop({
    type: Boolean,
    default: false,
  })
  sendEmailToCustomer: boolean;

  @Prop({
    required: true,
    enum: OpportunityVisibility,
    default: OpportunityVisibility.PRIVATE,
  })
  visibility: OpportunityVisibility;

  @Prop({
    type: Boolean,
    default: false,
  })
  protected: boolean;

  @Prop({
    type: Boolean,
    default: false,
  })
  matchingAlert: boolean;

  // ==========================================
  // 5. System/Status Fields
  // ==========================================

  @Prop({
    required: true,
    enum: OpportunityStatus,
    default: OpportunityStatus.IN_PROGRESS,
    index: true,
  })
  status: OpportunityStatus;

  @Prop({
    type: Date,
    default: Date.now,
    index: true,
  })
  assignDate: Date;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'User',
    required: false,
  })
  createdBy?: User;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'User',
    required: false,
  })
  updatedBy?: User;

  @Prop({
    required: false,
    type: Number,
  })
  latitude?: number;

  @Prop({
    required: false,
    type: Number,
  })
  longitude?: number;
}

export const OpportunitySchema =
  SchemaFactory.createForClass(Opportunity);