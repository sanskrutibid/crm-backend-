import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { User } from '../../users/schemas/user.schema';
import { Contact } from '../../contacts/schemas/contact.schema';

export type CampaignDocument = Campaign & Document;

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
export class Campaign {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, trim: true })
  type: string; // e.g., 'Email Campaign', 'SMS Campaign'

  @Prop({ required: true, trim: true })
  template: string; // Store selected template name or ID

  @Prop({ required: true, trim: true })
  schedule: string; // 'On Demand' | 'Daily' | 'Weekly' | 'Monthly'

  @Prop({ trim: true })
  time?: string; // e.g., '10:00 AM'

  @Prop({ trim: true })
  startDate?: string; // e.g. '2026-06-03'

  @Prop({ type: [String], default: [] })
  setWeeks?: string[]; // e.g., ['Monday', 'Wednesday']

  @Prop({ type: [Number], default: [] })
  setDays?: number[]; // e.g., [1, 15]

  @Prop({
    type: {
      customerType: { type: String },
      contactType: { type: String },
      branch: { type: String },
      assignedTo: { type: String },
      submittedBy: { type: String },
      createDateFrom: { type: String },
      createDateTo: { type: String },
      city: { type: String },
      location: { type: String },
      folder: { type: String },
      source: { type: String },
      dndOptions: { type: String },
      searchType: { type: String },
    },
    _id: false,
  })
  recipientFilters?: {
    customerType?: string;
    contactType?: string;
    branch?: string;
    assignedTo?: string;
    submittedBy?: string;
    createDateFrom?: string;
    createDateTo?: string;
    city?: string;
    location?: string;
    folder?: string;
    source?: string;
    dndOptions?: string;
    searchType?: string;
  };

  @Prop({
    type: [{ type: MongooseSchema.Types.ObjectId, ref: 'Contact' }],
    default: [],
  })
  contacts: Contact[];

  @Prop({ type: Number, default: 0 })
  totalRecords: number;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: false })
  createdBy?: User;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: false })
  updatedBy?: User;
}

export const CampaignSchema = SchemaFactory.createForClass(Campaign);
