import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { Contact } from '../../contacts/schemas/contact.schema';
import { Project } from '../../projects/schemas/project.schema';

export type HistoryDocument = History & Document;

export enum HistoryPriority {
  LOW = 'Low',
  MEDIUM = 'Medium',
  HIGH = 'High',
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
export class History {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Contact',
    required: true,
    index: true,
  })
  contactId: Contact;

  @Prop({ required: true, trim: true })
  conversation: string;

  @Prop({ type: Date, default: Date.now, index: true })
  date: Date;

  @Prop({
    required: true,
    enum: HistoryPriority,
    default: HistoryPriority.LOW,
    index: true,
  })
  priority: HistoryPriority;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Project',
    required: false,
    index: true,
  })
  projectId?: Project;

  @Prop({ trim: true, required: false })
  location?: string;
}

export const HistorySchema = SchemaFactory.createForClass(History);
