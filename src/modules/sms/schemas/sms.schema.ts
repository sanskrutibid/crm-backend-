import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { User } from '../../users/schemas/user.schema';

export type SmsDocument = Sms & Document;

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
export class Sms {
  @Prop({ type: [String], required: true })
  mobiles: string[];

  @Prop({ required: true, trim: true })
  message: string;

  @Prop({ trim: true })
  dltTemplateId?: string;

  @Prop({ trim: true })
  route?: string;

  @Prop({ type: Date, required: true, index: true })
  scheduleTime: Date;

  @Prop({
    type: String,
    enum: ['Pending', 'Sent', 'Failed'],
    default: 'Pending',
    index: true,
  })
  status: string;

  @Prop({ type: Date })
  sentAt?: Date;

  @Prop({ trim: true })
  errorMessage?: string;

  @Prop({ type: [String], default: [] })
  messageSids?: string[];

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'User',
    required: false,
    index: true,
  })
  createdBy?: User;
}

export const SmsSchema = SchemaFactory.createForClass(Sms);
