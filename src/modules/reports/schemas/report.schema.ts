import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document as MongooseDocument, Schema as MongooseSchema } from 'mongoose';
import { User } from '../../users/schemas/user.schema';

export type ReportDocument = ReportClass & MongooseDocument;

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
export class ReportClass {
  @Prop({ required: true, trim: true, index: true })
  name: string;

  @Prop({ required: false, trim: true })
  description?: string;

  @Prop({ required: false, trim: true })
  permission?: string;

  @Prop({ required: true, trim: true, index: true, default: 'Adhoc Report' })
  type: string; // 'Adhoc Report' | 'Daily Report' | 'Weekly Report' | 'Monthly Report'

  @Prop({ required: true, trim: true, index: true, default: 'Active' })
  validity: string; // 'Active' | 'Inactive'

  @Prop({ required: true, trim: true, default: 'On Demand' })
  nextRun: string; // 'On Demand' or date/time string e.g. '01 Jul 2025 6:00 PM'

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'User',
    required: false,
    index: true,
  })
  createdBy?: User;
}

export const ReportSchema = SchemaFactory.createForClass(ReportClass);
