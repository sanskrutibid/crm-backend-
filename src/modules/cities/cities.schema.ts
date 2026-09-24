import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type CityDocument = HydratedDocument<City>;

@Schema({
  collection: 'cities',
  timestamps: true,
})
export class City {

  @Prop({
    required: true,
    trim: true,
    index: true,
  })
  name: string;

  @Prop({
    default: 'India',
    trim: true,
    index: true,
  })
  country: string;

  @Prop({
    trim: true,
    index: true,
  })
  state: string;

  @Prop({
    trim: true,
    index: true,
  })
  stateCode: string;

  @Prop({
    trim: true,
    index: true,
  })
  district: string;

  @Prop({
    default: true,
    index: true,
  })
  isActive: boolean;
}

export const CitySchema =
  SchemaFactory.createForClass(City);