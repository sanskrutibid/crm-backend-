import {
  Prop,
  Schema,
  SchemaFactory,
} from '@nestjs/mongoose';

import {
  HydratedDocument,
} from 'mongoose';

export type PincodeLocalityDocument =
  HydratedDocument<PincodeLocality>;

@Schema({
  collection: 'pincode_localities',
})
export class PincodeLocality {

  @Prop({
    index: true,
    trim: true,
  })
  city: string;

  @Prop({
    trim: true,
  })
  officeName: string;

  @Prop({
    trim: true,
  })
  pincode: string;

  @Prop({
    index: true,
    trim: true,
  })
  district: string;

  @Prop({
    index: true,
    trim: true,
  })
  taluk: string;

  @Prop({
    index: true,
    trim: true,
  })
  division: string;

  @Prop({
    index: true,
    trim: true,
  })
  state: string;
}

export const PincodeLocalitySchema =
  SchemaFactory.createForClass(
    PincodeLocality,
  );

PincodeLocalitySchema.index({
  city: 1,
  state: 1,
});

PincodeLocalitySchema.index({
  city: 1,
});

PincodeLocalitySchema.index({
  state: 1,
});