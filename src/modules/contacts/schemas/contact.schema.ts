import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { User } from '../../users/schemas/user.schema';

export type ContactDocument = Contact & Document;

/**
 * Enums representing various contact statuses and classifications.
 */
export enum DNDStatus {
  PENDING = 'Pending',
  DND = 'DND Number',
  NON_DND = 'Non-DND Number',
}

export enum EmailStatus {
  PENDING = 'Pending',
  SAFE = 'Safe to send',
  UNSAFE = 'Not safe to send',
}

export enum ContactVisibility {
  PRIVATE = 'Private',
  BRANCH = 'Branch',
}

@Schema({
  timestamps: true, // Automatically provides createdAt & updatedAt audit timestamps
  toJSON: {
    transform: (doc, ret: any) => {
      if (ret._id) {
        ret.id = ret._id.toString();
        delete ret._id;
      }
      delete ret.__v;
      return ret;
    },
  },
})
export class Contact {
  // ==========================================
  // 1. Personal Information (Step 1)
  // ==========================================
  @Prop({ trim: true })
  salutation?: string; // e.g. Mr, Mrs, Dr

  @Prop({ required: true, trim: true })
  firstName: string;

  @Prop({ trim: true })
  lastName?: string;

  @Prop({ required: true, trim: true, index: true })
  customerType: string; // e.g. Customer, Landlord, Shared, Broker

  @Prop({ required: true, trim: true, index: true })
  contactType: string; // e.g. Employee, Broker

  @Prop({ required: true, trim: true })
  countryCode: string;

  @Prop({ required: true, trim: true, index: true })
  mobile: string; // Labeled Country Code + 10 digit mobile

  @Prop({ required: true, enum: DNDStatus, default: DNDStatus.PENDING })
  dndStatus: DNDStatus;

  @Prop({ trim: true })
  otherNumbers?: string;

  @Prop({ trim: true, lowercase: true })
  email?: string;

  @Prop({ required: true, enum: EmailStatus, default: EmailStatus.PENDING })
  emailStatus: EmailStatus;

  @Prop({ trim: true, index: true })
  uniqueNumber?: string; // unique identification e.g. GC170426-110807-2165

  @Prop({ trim: true })
  address?: string;

  @Prop({ trim: true })
  city?: string;

  @Prop({ trim: true })
  locality?: string;

  @Prop({ trim: true })
  pincode?: string;

  // ==========================================
  // 2. Professional Information (Step 2)
  // ==========================================
  @Prop({ trim: true })
  companyName?: string;

  @Prop({ trim: true })
  businessDomain?: string; // Labeled "Business"

  @Prop({ trim: true })
  companyType?: string;

  @Prop({ trim: true })
  designation?: string;

  @Prop({ trim: true })
  investCapacity?: string;

  @Prop({ trim: true })
  bankName?: string;

  @Prop({ trim: true })
  bankAccountName?: string;

  @Prop({ trim: true })
  bankAccountNumber?: string; // Labeled "Bank A/C"

  @Prop({ trim: true })
  ifscCode?: string;

  @Prop({ trim: true })
  professionalAddress?: string;

  @Prop({ trim: true })
  professionalCity?: string;

  @Prop({ trim: true })
  professionalLocality?: string;

  // ==========================================
  // 3. Other Information (Step 3)
  // ==========================================
  @Prop({ trim: true })
  dob?: string; // Date of Birth

  @Prop({ trim: true })
  anniversary?: string; // Anniversary Date

  @Prop({ type: Boolean, default: true })
  sendEmailGreeting: boolean;

  @Prop({ type: Boolean, default: true })
  sendSmsGreeting: boolean;

  @Prop({ trim: true })
  faxNumber?: string;

  @Prop({ trim: true })
  website?: string;

  @Prop({ trim: true })
  skype?: string;

  @Prop({ trim: true, default: 'English' })
  preferredLanguage?: string;

  @Prop({ type: Number, default: 1.0 })
  rating?: number; // Labeled Rating(%)[1.00]

  @Prop({ trim: true })
  customerRemark?: string; // Labeled "Customer's Remark"

  // ==========================================
  // 4. Save and Publish Settings (Step 4)
  // ==========================================
  @Prop({ trim: true })
  keyword?: string; // e.g. "Dhantoli ,172Sqft flat 2cr"

  @Prop({ trim: true })
  folder?: string;

  @Prop({ required: true, trim: true, index: true })
  source: string; // e.g. Website, Campaigns, WhatsApp

  @Prop({ required: true, trim: true, index: true })
  branch: string; // e.g. "Global Team"

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'User',
    index: true,
  })
  assignedTo?: User; // Dropdown label "Assignee"

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'User',
    required: false,
    index: true,
  })
  createdBy?: User;

  @Prop({ trim: true, required: false })
  createdIp?: string;

  @Prop({ trim: true })
  photograph?: string; // URL path of profile image upload

  @Prop({
    required: true,
    enum: ContactVisibility,
    default: ContactVisibility.PRIVATE,
  })
  visibility: ContactVisibility;

  @Prop({ type: Boolean, default: false })
  isConfidential: boolean;

  @Prop({ type: Boolean, default: true })
  subscribePromotions: boolean;

  @Prop({ type: Boolean, default: false, index: true })
  isStarred: boolean;

  @Prop({ trim: true })
  status?: string; // e.g. Active, Inactive, DND

  @Prop({ trim: true })
  statusRemark?: string; // Remark explaining status update

  @Prop({ type: Boolean, default: false, index: true })
  isDeleted: boolean;

  @Prop({ type: Date })
  deletedAt?: Date;

  @Prop({
    type: [
      {
        type: { type: String, required: true },
        name: { type: String, required: true },
        branch: { type: String, required: true },
        assignee: { type: String, required: true },
        isPublic: { type: Boolean, default: true },
        url: { type: String },
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
    default: [],
  })
  documents: {
    type: string;
    name: string;
    branch: string;
    assignee: string;
    isPublic: boolean;
    url?: string;
    uploadedAt: Date;
  }[];
}

export const ContactSchema = SchemaFactory.createForClass(Contact);
