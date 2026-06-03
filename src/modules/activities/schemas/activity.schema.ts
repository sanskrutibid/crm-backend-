import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { User } from '../../users/schemas/user.schema';

export type ActivityDocument = Activity & Document;

export enum ActivityType {
  LEAD = 'lead',
  PROPERTY = 'property',
  TASK = 'task',
  OPPORTUNITY = 'opportunity',
  SYSTEM = 'system',
  SITE_VISIT = 'site-visit',
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
export class Activity {
  @Prop({ required: true, trim: true })
  description: string;

  @Prop({
    required: true,
    enum: ActivityType,
    default: ActivityType.SYSTEM,
    index: true,
  })
  type: ActivityType;

  @Prop({ type: Date, default: Date.now, index: true })
  timestamp: Date;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'User',
    required: false,
    index: true,
  })
  performedBy?: User;
}

export const ActivitySchema = SchemaFactory.createForClass(Activity);
