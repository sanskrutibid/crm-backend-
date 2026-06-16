import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { User } from '../../users/schemas/user.schema';
import { Contact } from '../../contacts/schemas/contact.schema';
import { Lead } from './lead.schema';

export type LeadConversionLogDocument = LeadConversionLog & Document;

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
export class LeadConversionLog {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Contact',
    required: true,
    index: true,
  })
  contactId: Contact;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Lead',
    required: true,
    index: true,
  })
  leadId: Lead;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  })
  convertedBy: User;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  })
  assignedTo: User;
}

export const LeadConversionLogSchema = SchemaFactory.createForClass(LeadConversionLog);
