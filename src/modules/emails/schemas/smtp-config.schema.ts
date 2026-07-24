import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type SmtpConfigDocument = SmtpConfig & Document;

@Schema({
  timestamps: true,
  toJSON: {
    transform: (doc, ret: any) => {
      // Remove encrypted password and IV details when converting to JSON
      delete ret.pass;
      delete ret.iv;
      ret.id = ret._id.toString();
      delete ret._id;
      delete ret.__v;
      return ret;
    },
  },
})
export class SmtpConfig {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, unique: true })
  userId: Types.ObjectId;

  @Prop({ required: true, trim: true })
  host: string;

  @Prop({ required: true })
  port: number;

  @Prop({ default: false })
  secure: boolean;

  @Prop({ required: true, trim: true })
  user: string;

  @Prop({ required: true })
  pass: string;

  @Prop({ required: true })
  iv: string;

  @Prop({ trim: true, default: '' })
  fromName?: string;
}

export const SmtpConfigSchema = SchemaFactory.createForClass(SmtpConfig);
