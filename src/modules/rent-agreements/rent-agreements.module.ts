import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  RentAgreement,
  RentAgreementSchema,
} from './schemas/rent-agreement.schema';
import { RentAgreementsController } from './rent-agreements.controller';
import { RentAgreementsService } from './rent-agreements.service';
import {
  Property,
  PropertySchema,
} from '../properties/schemas/property.schema';
import { Contact, ContactSchema } from '../contacts/schemas/contact.schema';
import { ActivitiesModule } from '../activities/activities.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: RentAgreement.name, schema: RentAgreementSchema },
      { name: Property.name, schema: PropertySchema },
      { name: Contact.name, schema: ContactSchema },
    ]),
    ActivitiesModule,
  ],
  controllers: [RentAgreementsController],
  providers: [RentAgreementsService],
  exports: [RentAgreementsService],
})
export class RentAgreementsModule {}
