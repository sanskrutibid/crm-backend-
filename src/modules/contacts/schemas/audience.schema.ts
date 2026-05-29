import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { Contact } from './contact.schema';

export type AudienceDocument = Audience & Document;

export enum ScheduleType {
  ON_DEMAND = 'On Demand',
  DAILY = 'Daily',
  WEEKLY = 'Weekly',
  MONTHLY = 'Monthly',
}

export enum AudienceType {
  EMAIL = 'Email',
  SMS = 'SMS',
  IVR = 'IVR',
  WHATSAPP = 'WhatsApp',
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
export class Audience {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, enum: AudienceType, trim: true })
  type: AudienceType; // Email, SMS, IVR, WhatsApp

  @Prop({ required: true, trim: true })
  template: string;

  @Prop({ required: true, enum: ScheduleType, trim: true })
  schedule: ScheduleType; // On Demand, Daily, Weekly, Monthly

  @Prop({ trim: true })
  time?: string; // e.g. "11:57am"

  @Prop({ trim: true })
  startDate?: string; // e.g. "2027-03-25" or "25-Mar-2027"

  @Prop({ type: [String] })
  setWeeks?: string[]; // e.g. ["Monday", "Wednesday"]

  @Prop({ type: [Number] })
  setDays?: number[]; // e.g. [3, 15]

  @Prop({ type: [{ type: MongooseSchema.Types.ObjectId, ref: 'Contact' }] })
  contacts: Contact[];

  @Prop({ type: Number, default: 0 })
  totalRecords: number;
}

export const AudienceSchema = SchemaFactory.createForClass(Audience);
