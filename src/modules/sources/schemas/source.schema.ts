import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type SourceDocument = Source & Document;

@Schema({
  timestamps: true,
  toJSON: {
    transform: (doc, ret: any) => {
      /* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment */
      const rawId = ret._id ? ret._id.toString() : '';
      ret.id = rawId;
      ret._id = rawId;
      ret.sourceId = typeof ret.sourceId === 'number' ? ret.sourceId : 1;
      ret.source_id = ret.sourceId;
      ret.sourceName = ret.name || '';
      ret.source_name = ret.name || '';
      ret.name = ret.name || '';
      ret.source = ret.name || '';
      ret.label = ret.name || '';
      ret.value = ret.sourceId || ret.name || '';
      delete ret.__v;
      return ret;
      /* eslint-enable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment */
    },
  },
  toObject: {
    transform: (doc, ret: any) => {
      /* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment */
      const rawId = ret._id ? ret._id.toString() : '';
      ret.id = rawId;
      ret._id = rawId;
      ret.sourceId = typeof ret.sourceId === 'number' ? ret.sourceId : 1;
      ret.source_id = ret.sourceId;
      ret.sourceName = ret.name || '';
      ret.source_name = ret.name || '';
      ret.name = ret.name || '';
      ret.source = ret.name || '';
      ret.label = ret.name || '';
      ret.value = ret.sourceId || ret.name || '';
      delete ret.__v;
      return ret;
      /* eslint-enable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment */
    },
  },
})
export class Source {
  @Prop({ type: Number, unique: true, index: true })
  sourceId: number;

  @Prop({ required: true, unique: true, trim: true })
  name: string;

  @Prop({ type: Boolean, default: true })
  isActive?: boolean;
}

export const SourceSchema = SchemaFactory.createForClass(Source);


