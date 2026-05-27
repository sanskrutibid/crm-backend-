import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type PropertyDocument = Property & Document;

/**
 * Enum defining available statuses for real-estate properties.
 * Matches frontend CRM expectations for listing availability stages.
 */
export enum PropertyStatus {
  AVAILABLE = 'Available',
  SOLD_OUT = 'Sold Out',
  UNDER_CONSTRUCTION = 'Under Construction',
}

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
export class Property {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, trim: true })
  location: string;

  @Prop({ required: true, trim: true })
  type: string;

  @Prop({ required: true, trim: true })
  price: string;

  @Prop({ required: true, type: Number })
  sqft: number;

  @Prop({ required: true, enum: PropertyStatus, default: PropertyStatus.AVAILABLE })
  status: PropertyStatus;

  @Prop({ required: true, trim: true })
  builder: string;
}

export const PropertySchema = SchemaFactory.createForClass(Property);
