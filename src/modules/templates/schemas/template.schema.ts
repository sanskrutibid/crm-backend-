import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { User } from '../../users/schemas/user.schema';

export type TemplateDocument = Template & Document;

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
export class Template {
  @Prop({ required: true, trim: true, index: true })
  name: string;

  @Prop({ trim: true, index: true })
  templateId?: string;

  @Prop({ required: true, trim: true, index: true })
  templateType: string; // e.g. "SMS", "Email", "WhatsApp"

  @Prop({ required: true, trim: true, default: 'editor', index: true })
  layoutType: string; // "editor" | "file" | "url"

  @Prop({ trim: true })
  editorContent?: string;

  @Prop({ trim: true })
  fileName?: string;

  @Prop({ trim: true })
  fileContent?: string;

  @Prop({ trim: true })
  importUrl?: string;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'User',
    required: false,
    index: true,
  })
  createdBy?: User;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'User',
    required: false,
    index: true,
  })
  updatedBy?: User;
}

export const TemplateSchema = SchemaFactory.createForClass(Template);
