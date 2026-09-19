import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import {
  Document as MongooseDocument,
  Schema as MongooseSchema,
} from 'mongoose';
import { User } from '../../users/schemas/user.schema';

export type DocumentClassDocument = DocumentClass & MongooseDocument;

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
export class DocumentClass {
  @Prop({ required: true, trim: true, index: true, default: 'General' })
  type: string; // 'General' | 'Brochure' | 'Legal' | 'Other'

  @Prop({ required: true, trim: true, index: true })
  title: string;

  @Prop({ required: false, trim: true })
  description?: string;

  @Prop({ required: false, type: Number })
  rating?: number; // Slider rating e.g., 34.42

  @Prop({ required: true, trim: true })
  fileUrl: string; // Path or URL of the uploaded document file

  @Prop({ required: false, trim: true, index: true })
  folder?: string;

  @Prop({ required: true, trim: true, index: true })
  branch: string;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'User',
    required: false,
    index: true,
  })
  assignee?: User;

  @Prop({ type: Boolean, default: true })
  isPublic: boolean;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'User',
    required: false,
    index: true,
  })
  createdBy?: User;
}

export const DocumentSchema = SchemaFactory.createForClass(DocumentClass);
