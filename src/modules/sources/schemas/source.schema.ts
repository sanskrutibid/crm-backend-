import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type SourceDocument = Source & Document;

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
export class Source {
  @Prop({ required: true, unique: true, trim: true })
  name: string;
}

export const SourceSchema = SchemaFactory.createForClass(Source);
