import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type FolderDocument = Folder & Document;

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
export class Folder {
  @Prop({ required: true, trim: true })
  folderName: string;

  @Prop({ required: true, trim: true })
  module: string; // e.g., Customer, Lead, Opportunities, Property, Project, Document

  @Prop({ required: false, default: '' })
  permission: string; // private, public

  @Prop({ type: Number, default: 0 })
  orderNumber: number;

  @Prop({ required: false, default: 'Basic Folder' })
  configurationType: string; // Basic Folder, etc.

  @Prop({ type: Boolean, default: false })
  onlyAssigned: boolean;

  @Prop({ type: Boolean, default: false })
  smartFolder: boolean;

  @Prop({ required: false, trim: true })
  categoryProperty?: string;
}

export const FolderSchema = SchemaFactory.createForClass(Folder);
