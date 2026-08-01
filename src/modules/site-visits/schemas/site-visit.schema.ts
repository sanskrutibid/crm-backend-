import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { User } from '../../users/schemas/user.schema';

export type SiteVisitDocument = SiteVisit & Document;

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
export class SiteVisit {
  @Prop({ required: true, trim: true, index: true })
  visitor: string;

  @Prop({ required: true, trim: true, index: true })
  visitType: string;

  @Prop({ required: true, trim: true, index: true })
  module: string;

  @Prop({ trim: true, index: true })
  siteName?: string;

  @Prop({ trim: true })
  otherName?: string;

  @Prop({ required: true, trim: true, index: true })
  visitDate: string; // e.g. "2026-06-03"

  @Prop({ required: true, trim: true })
  timeIn: string; // e.g. "12:00 PM"

  @Prop({ required: true, trim: true })
  timeOut: string; // e.g. "01:00 PM"

  @Prop({ trim: true })
  remark?: string;

  @Prop({ required: true, trim: true, index: true })
  siteManager: string;

  @Prop({ trim: true })
  sourcingManager?: string;

  @Prop({ trim: true })
  closingManager?: string;

  @Prop({ required: true, trim: true, index: true })
  source: string;

  @Prop({ required: true, trim: true, index: true })
  branch: string;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  })
  assignee: User;

  @Prop({ required: true, trim: true, index: true })
  visitStatus: string; // matches Status field

  @Prop({ type: Boolean, default: false })
  sendSmsNotification: boolean;

  @Prop({ type: Boolean, default: false })
  sendEmailNotification: boolean;

  @Prop({ type: Boolean, default: false, index: true })
  isPrivate: boolean;

  @Prop({ trim: true })
  photograph?: string;

  @Prop({ type: Number })
  latitude?: number;

  @Prop({ type: Number })
  longitude?: number;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'User',
    required: false,
    index: true,
  })
  createdBy?: User; // matches "Submitted By"

  @Prop({ type: Number, default: 0, index: true })
  lockingDaysLeft?: number; // matches "Locking Days Left"

  @Prop({ type: Number, default: 0, index: true })
  noOfReVisit?: number; // matches "No of Re-Visit"

  @Prop({ trim: true })
  reasons?: string; // matches "Reasons"

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Lead',
    required: false,
    index: true,
  })
  leadId?: string;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Contact',
    required: false,
    index: true,
  })
  contactId?: string;

  @Prop({ trim: true })
  otp?: string;

  @Prop({ type: Date })
  otpExpiresAt?: Date;

  @Prop({ trim: true })
  googleEventId?: string;
}

export const SiteVisitSchema = SchemaFactory.createForClass(SiteVisit);
