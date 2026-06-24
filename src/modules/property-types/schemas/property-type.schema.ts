import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type PropertyTypeDocument = PropertyType & Document;

@Schema({
  timestamps: true,
  toJSON: {
    transform: (doc, ret: any) => {
      /* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-return */
      ret.id = ret._id.toString();
      delete ret._id;
      delete ret.__v;
      return ret;
      /* eslint-enable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-return */
    },
  },
})
export class PropertyType {
  @Prop({ required: true, trim: true })
  category: string; // e.g. "Residential", "Commercial"

  @Prop({ required: true, trim: true })
  subCategory: string; // e.g. "Flat", "Apartment", "Office Space", "Warehouse"

  @Prop({ type: Boolean, default: true })
  isActive?: boolean;
}

export const PropertyTypeSchema = SchemaFactory.createForClass(PropertyType);

// Compound unique index to ensure category + subCategory is unique
PropertyTypeSchema.index({ category: 1, subCategory: 1 }, { unique: true });
