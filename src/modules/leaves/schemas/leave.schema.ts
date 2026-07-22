import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, Types } from 'mongoose';

export type LeaveDocument = Leave & Document;

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
export class Leave {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Employee', required: false })
  employee?: Types.ObjectId;

  @Prop({ required: true, trim: true })
  employeeId: string;

  @Prop({ required: true, trim: true })
  employeeName: string;

  @Prop({ required: true, trim: true })
  employeeEmail: string;

  @Prop({ required: true, trim: true, default: 'Casual Leave' })
  leaveType: string;

  @Prop({ required: true })
  startDate: Date;

  @Prop({ required: true })
  endDate: Date;

  @Prop({ required: true, default: 1 })
  totalDays: number;

  @Prop({ default: false })
  isHalfDay: boolean;

  @Prop({ trim: true, default: 'Full Day' })
  halfDaySession?: string;

  @Prop({ required: true, trim: true })
  reason: string;

  @Prop({
    required: true,
    trim: true,
    default: 'Pending',
    enum: ['Pending', 'Approved', 'Declined', 'Cancelled'],
  })
  status: string;

  @Prop({ default: Date.now })
  appliedOn: Date;

  @Prop({ trim: true, default: '' })
  actionBy?: string;

  @Prop({ trim: true, default: '' })
  actionReason?: string;

  @Prop({ type: Date, default: null })
  actionDate?: Date;
}

export const LeaveSchema = SchemaFactory.createForClass(Leave);
