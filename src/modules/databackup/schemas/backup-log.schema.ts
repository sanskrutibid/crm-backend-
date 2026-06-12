import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type BackupLogDocument = BackupLog & Document;

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
export class BackupLog {
  @Prop({ required: true, trim: true })
  version: string;

  @Prop({ required: true, trim: true })
  modules: string;

  @Prop({ required: true, trim: true })
  filename: string;

  @Prop({ required: true, trim: true })
  size: string;

  @Prop({ required: true, trim: true, enum: ['Manual', 'Scheduled'] })
  type: string;

  @Prop({
    required: true,
    trim: true,
    enum: ['Completed', 'In Progress', 'Failed'],
  })
  status: string;

  @Prop({ type: Date, default: Date.now })
  date: Date;
}

export const BackupLogSchema = SchemaFactory.createForClass(BackupLog);
