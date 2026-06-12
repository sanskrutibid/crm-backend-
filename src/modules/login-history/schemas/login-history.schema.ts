import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { User } from '../../users/schemas/user.schema';

export type LoginHistoryDocument = LoginHistory & Document;

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
export class LoginHistory {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  })
  userId: User | string;

  @Prop({
    type: String,
    required: true,
    enum: ['login', 'logout'],
    index: true,
  })
  type: 'login' | 'logout';

  @Prop({ required: true, trim: true })
  ip: string;

  @Prop({ required: false, trim: true })
  userAgent?: string;

  @Prop({ required: false, trim: true })
  device?: string;

  @Prop({ required: false, type: Number })
  lat?: number;

  @Prop({ required: false, type: Number })
  long?: number;

  @Prop({ type: Date, default: Date.now, index: true })
  timestamp: Date;
}

export const LoginHistorySchema = SchemaFactory.createForClass(LoginHistory);
