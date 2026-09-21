import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { User } from '../../users/schemas/user.schema';
import { Contact } from '../../contacts/schemas/contact.schema';

export type ProjectDocument = Project & Document;

export enum ProjectStatus {
  AVAILABLE = 'Available',
  SOLD_OUT = 'Sold Out',
}

export enum ProjectVisibility {
  PRIVATE = 'Private',
  BRANCH = 'Branch',
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
export class Project {
  // ==========================================
  // Step 1: Contact Information (Owner)
  // ==========================================
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Contact',
    required: true,
    index: true,
  })
  contactId: Contact; // Labeled "Project Owner*"

  // ==========================================
  // Step 2: Basic Information
  // ==========================================
  @Prop({ required: true, trim: true })
  launchDate: string; // Labeled "Launch Date*" (e.g. "Select Date")

  @Prop({ required: true, trim: true, index: true })
  projectName: string; // Labeled "Project Name*"

  @Prop({ trim: true })
  reraNumber?: string; // Labeled "RERA/HIRA Number"

  @Prop({ trim: true })
  districtCode?: string; // Labeled "District Code Name"

  @Prop({ type: Number })
  lockingDuration?: number; // Labeled "Locking Duration(Days)"

  @Prop({ type: Number })
  projectArea?: number; // Labeled "Project Area"

  @Prop({ trim: true })
  areaUnit?: string; // e.g. "Sq.Ft.", "Sq.Meter"

  @Prop({ trim: true })
  type?: string; // Labeled "Type"

  @Prop({ trim: true })
  totalRoom?: string; // Labeled "Total Room"

  @Prop({ type: Number })
  price?: number; // Labeled "Price"

  @Prop({ trim: true })
  interestedIn?: string; // Labeled "Interested In"

  @Prop({ trim: true })
  transactionType?: string; // Labeled "Transaction Type"

  @Prop({ trim: true })
  developerName?: string; // Labeled "Developer Name"

  @Prop({ trim: true })
  siteManager?: string; // Labeled "Site Manager"

  @Prop({ trim: true })
  siteManagerContact?: string; // Labeled "Site Manager Contact"

  @Prop({ trim: true })
  sourcingManager?: string; // Labeled "Sourcing Manager"

  @Prop({ trim: true })
  sourcingManagerContact?: string; // Labeled "Sourcing Manager Contact"

  @Prop({ trim: true })
  closingManager?: string; // Labeled "Closing Manager"

  @Prop({ trim: true })
  closingManagerContact?: string; // Labeled "Closing Manager Contact"

  @Prop({ trim: true })
  description?: string; // Labeled "Description" (Max 2000 chars)

  @Prop({ trim: true })
  remark?: string; // Labeled "Remark" (Max 2000 chars)

  @Prop({ trim: true })
  approvedBy?: string; // Labeled "Approved by"

  @Prop({ type: Boolean, default: false })
  commencementCertificate: boolean; // Checkbox

  @Prop({ type: Boolean, default: false })
  occupancyCertificate: boolean; // Checkbox

  // ==========================================
  // Step 3: Specifications
  // ==========================================
  @Prop({ trim: true })
  specification?: string; // Rich Text editor HTML / text string

  @Prop({ type: Number })
  openSpacePercentage?: number; // Labeled "Open Space(%)"

  @Prop({ type: [String], default: [] })
  amenities: string[]; // Labeled "Amenities"

  @Prop({ trim: true })
  videoUrl?: string; // Labeled "Video" (Vimeo/Youtube url)

  @Prop({ trim: true })
  virtualVideoUrl?: string; // Labeled "Virtual Video"

  @Prop({ trim: true })
  websiteKeywords?: string; // Labeled "Website Keywords"

  // ==========================================
  // Step 4: Location details
  // ==========================================
  @Prop({ trim: true })
  address?: string; // Labeled "Address"

  @Prop({ type: Number })
  latitude?: number;

  @Prop({ type: Number })
  longitude?: number;

  @Prop({ trim: true })
  buildingPremises?: string; // Labeled "Building/Premises"

  @Prop({ required: true, trim: true, index: true })
  city: string; // Labeled "City*"

  @Prop({ required: true, trim: true, index: true })
  locality: string; // Labeled "Locality*"

  @Prop({ trim: true })
  landmark?: string; // Labeled "Landmark"

  @Prop({ trim: true })
  pinCode?: string; // Labeled "Pin Code"

  // ==========================================
  // Step 5: Save and Publish settings
  // ==========================================
  @Prop({ trim: true })
  keyword?: string; // Labeled "Keyword"

  @Prop({ trim: true })
  folder?: string; // Labeled "Folder"

  @Prop({ trim: true })
  completionDate?: string;

  @Prop({ trim: true })
  possession?: string;

  @Prop({ trim: true })
  possessionMonth?: string;

  @Prop({ trim: true })
  possessionYear?: string;

  @Prop({ trim: true })
  preferName?: string;

  @Prop({ trim: true })
  preferredFacls?: string;

  @Prop({ trim: true })
  zoneNumber?: string;

  @Prop({ trim: true })
  title?: string;

  @Prop({ required: true, trim: true, index: true })
  branch: string; // Labeled "Branch*"

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'User',
    required: false, // Optional assignment
    index: true,
  })
  assignedTo?: User; // Labeled "Assignee*"

  @Prop({ type: Boolean, default: false })
  featuredProject: boolean; // Toggle switch

  @Prop({
    required: true,
    enum: ProjectVisibility,
    default: ProjectVisibility.PRIVATE,
  })
  visibility: ProjectVisibility; // Private / Branch

  // ==========================================
  // System fields
  // ==========================================
  @Prop({
    required: true,
    enum: ProjectStatus,
    default: ProjectStatus.AVAILABLE,
    index: true,
  })
  status: ProjectStatus;

  @Prop({ type: Boolean, default: false })
  publishedOnWebsite?: boolean;

  @Prop({ type: [Object], default: [] })
  plans?: any[];

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: false })
  createdBy?: User;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: false })
  updatedBy?: User;

  @Prop({ trim: true })
  possessionDate?: string;

  @Prop({ type: [Object], default: [] })
  documents?: Record<string, any>[];

  @Prop({ type: [Object], default: [] })
  images?: Record<string, any>[];
}

export const ProjectSchema = SchemaFactory.createForClass(Project);
