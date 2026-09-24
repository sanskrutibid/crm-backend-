import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { LocalitiesController } from './localities.controller';
import { LocalitiesService } from './localities.service';

import {
  PincodeLocality,
  PincodeLocalitySchema,
} from './localities.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: PincodeLocality.name,
        schema: PincodeLocalitySchema,
      },
    ]),
  ],

  controllers: [
    LocalitiesController,
  ],

  providers: [
    LocalitiesService,
  ],

  exports: [
    LocalitiesService,
  ],
})
export class LocalitiesModule {}