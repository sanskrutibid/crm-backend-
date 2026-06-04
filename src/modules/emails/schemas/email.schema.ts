import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { User } from '../../users/schemas/user.schema';

export type EmailDocument = Email & Document;

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
export class Email {
  @Prop({ type: [String], required: true })
  to: string[];

  @Prop({ type: [String], default: [] })
  cc: string[];

  @Prop({ type: [String], default: [] })
  bcc: string[];

  @Prop({ required: true, trim: true })
  subject: string;

  @Prop({ required: true, trim: true })
  body: string;

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

  @Prop({ type: Number, default: 0 })
  openCount: number;

  @Prop({
    type: [
      {
        openedAt: { type: Date, default: Date.now },
        ip: String,
        userAgent: String,
      },
    ],
    default: [],
  })
  opens: {
    openedAt: Date;
    ip: string;
    userAgent: string;
  }[];

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'User',
    required: false,
    index: true,
  })
  createdBy?: User;
}

export const EmailSchema = SchemaFactory.createForClass(Email);
