import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type LocationDocument = Location & Document;

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
export class Location {
  @Prop({ required: true, trim: true, index: true })
  countryCode: string; // e.g. "+91"

  @Prop({ required: true, trim: true, index: true })
  countryIso: string; // e.g. "IN"

  @Prop({ required: true, trim: true })
  countryName: string; // e.g. "India"

  @Prop({ required: true, trim: true, index: true })
  city: string; // e.g. "Nagpur"

  @Prop({ required: true, trim: true, index: true })
  pincode: string; // e.g. "440012"

  @Prop({ required: true, trim: true })
  locality: string; // e.g. "Dhantoli"
}

export const LocationSchema = SchemaFactory.createForClass(Location);
