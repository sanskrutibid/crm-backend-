import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type HolidayDocument = Holiday & Document;

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
export class Holiday {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, trim: true })
  date: string; // YYYY-MM-DD

  @Prop({ trim: true, default: '' })
  day?: string; // e.g. Monday

  @Prop({ trim: true, default: 'National Holiday' })
  type?: string;

  @Prop({ trim: true, default: 'All Employees' })
  applicableFor?: string;

  @Prop({ trim: true, default: '' })
  description?: string;

  @Prop({ trim: true, default: 'Active' })
  status?: string; // Active | Inactive

  @Prop({ default: true })
  notifyEmployees?: boolean;
}

export const HolidaySchema = SchemaFactory.createForClass(Holiday);
