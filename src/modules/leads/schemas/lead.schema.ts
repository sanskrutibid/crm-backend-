import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { User } from '../../users/schemas/user.schema';
import { Contact } from '../../contacts/schemas/contact.schema';

export type LeadDocument = Lead & Document;

export enum LeadTemperature {
  COLD = 'Cold',
  WARM = 'Warm',
  HOT = 'Hot',
}

export enum LeadStatus {
  IN_PROGRESS = 'In Progress',
  WON = 'Won',
  LOST = 'Lost',
}

export enum LeadVisibility {
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
export class Lead {
  // ==========================================
  // 1. Lead Information (Step 1)
  // ==========================================
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Contact',
    required: true,
    index: true,
  })
  contactId: Contact; // Labeled "Contact*" (links to registered contact profiles)

  @Prop({ required: true, trim: true })
  requirement: string; // "Please enter customer basic requirement..."

  @Prop({ required: true, trim: true })
  followupNote: string; // "Please enter followup note..."

  @Prop({ required: true, trim: true, index: true })
  scheduleDate: string; // e.g. "2026-05-26" or "26-May-2026"

  @Prop({ required: true, trim: true })
  scheduleTime: string; // e.g. "4:34pm"

  @Prop({ type: Number, default: 1.0 })
  score: number; // Labeled Score(%)[1.00]

  // ==========================================
  // 2. Save and Publish Settings (Step 2)
  // ==========================================
  @Prop({ trim: true })
  keywords?: string; // Labeled "Keywords"

  @Prop({ trim: true })
  folder?: string;

  @Prop({ required: true, trim: true, index: true })
  source: string; // Labeled "Source*"

  @Prop({ required: true, trim: true, index: true })
  branch: string; // Labeled "Branch*"

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  })
  assignedTo: User; // Labeled "Assignee*"

  @Prop({ type: Boolean, default: false })
  sendWhatsAppToAssignee: boolean;

  @Prop({ type: Boolean, default: false })
  sendEmailToAssignee: boolean;

  @Prop({ type: Boolean, default: false })
  sendWhatsAppToCustomer: boolean;

  @Prop({ type: Boolean, default: false })
  sendEmailToCustomer: boolean;

  @Prop({
    required: true,
    enum: LeadVisibility,
    default: LeadVisibility.PRIVATE,
  })
  visibility: LeadVisibility;

  @Prop({ type: Boolean, default: false })
  termsShared: boolean;

  // ==========================================
  // 3. Status Badges & Details (Screenshot 3 & 4)
  // ==========================================
  @Prop({
    required: true,
    enum: LeadTemperature,
    default: LeadTemperature.COLD,
    index: true,
  })
  temperature: LeadTemperature; // Labeled 'Cold', 'Warm', 'Hot'

  @Prop({
    required: true,
    enum: LeadStatus,
    default: LeadStatus.IN_PROGRESS,
    index: true,
  })
  status: LeadStatus; // Labeled 'In Progress', 'Won', 'Lost'

  @Prop({ trim: true, default: 'no response' })
  nextRemark?: string; // Labeled "Next Remark"

  @Prop({ trim: true, default: 'Said Not Looking Any Property Now' })
  outcome?: string; // Labeled "Outcome"

  @Prop({ trim: true })
  interestedIn?: string; // Labeled "Interested In"

  @Prop({ trim: true, default: 'Follow-Up Scheduled' })
  purpose?: string; // Labeled "Purpose"

  @Prop({ type: Date, default: Date.now, index: true })
  assignDate: Date; // Labeled "Assign Date"

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: false })
  createdBy?: User;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: false })
  updatedBy?: User;

  @Prop({
    type: [
      {
        visitor: { type: String, required: true },
        visitType: { type: String, required: true },
        module: { type: String, required: true },
        siteName: { type: String, required: true },
        otherName: { type: String },
        visitDate: { type: String, required: true },
        timeIn: { type: String, required: true },
        timeOut: { type: String, required: true },
        remark: { type: String },
        siteManager: { type: String, required: true },
        sourcingManager: { type: String },
        closingManager: { type: String },
        source: { type: String, required: true },
        branch: { type: String, required: true },
        assignee: { type: String, required: true },
        visitStatus: { type: String, required: true },
        sendSmsNotification: { type: Boolean, default: false },
        sendEmailNotification: { type: Boolean, default: false },
        visibility: { type: String, default: 'Private' },
        photograph: { type: String },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    default: [],
  })
  siteVisits: any[];
}

export const LeadSchema = SchemaFactory.createForClass(Lead);
