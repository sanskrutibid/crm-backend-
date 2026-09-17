import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import * as bcrypt from 'bcryptjs';

export type UserDocument = User & Document;

export enum UserRole {
  ADMIN = 'ADMIN',
  AGENT = 'AGENT',
}

@Schema({
  timestamps: true,
  toJSON: {
    transform: (doc, ret: any) => {
      delete ret.password;
      ret.id = ret._id.toString();
      delete ret._id;
      delete ret.__v;
      return ret;
    },
  },
})
export class User {
  @Prop({ required: true, unique: true, trim: true, lowercase: true })
  email: string;

  @Prop({ required: false })
  password?: string;

  @Prop({ required: true, trim: true })
  firstName: string;

  @Prop({ required: false, trim: true, default: '' })
  lastName?: string;

  @Prop({ required: true, default: 'Agent/Broker' })
  role: string;

  @Prop({ type: Map, of: Boolean, default: {} })
  customPermissions: Map<string, boolean>;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ trim: true })
  googleRefreshToken?: string;

  @Prop({ trim: true })
  googleAccessToken?: string;

  @Prop({ trim: true })
  googleEmail?: string;

  @Prop({ default: false })
  googleCalendarConnected: boolean;
}

export const UserSchema = SchemaFactory.createForClass(User);

// Hash password pre-save hook using clean promise returns without next callbacks
UserSchema.pre<UserDocument>('save', async function () {
  if (!this.isModified('password')) {
    return;
  }
  if (this.password) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }
});
