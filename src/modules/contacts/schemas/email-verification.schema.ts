import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type EmailVerificationDocument = EmailVerification & Document;

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
export class EmailVerification {
  @Prop({ required: true, trim: true, lowercase: true, index: true })
  email: string;

  @Prop({ required: true, trim: true })
  otp: string;

  @Prop({ required: true })
  expiresAt: Date;

  @Prop({ type: Boolean, default: false })
  verified: boolean;
}

export const EmailVerificationSchema = SchemaFactory.createForClass(EmailVerification);
