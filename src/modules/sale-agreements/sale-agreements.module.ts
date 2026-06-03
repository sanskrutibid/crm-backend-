import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SaleAgreement, SaleAgreementSchema } from './schemas/sale-agreement.schema';
import { SaleAgreementsController } from './sale-agreements.controller';
import { SaleAgreementsService } from './sale-agreements.service';
import { Property, PropertySchema } from '../properties/schemas/property.schema';
import { Contact, ContactSchema } from '../contacts/schemas/contact.schema';
import { ActivitiesModule } from '../activities/activities.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: SaleAgreement.name, schema: SaleAgreementSchema },
      { name: Property.name, schema: PropertySchema },
      { name: Contact.name, schema: ContactSchema },
    ]),
    ActivitiesModule,
  ],
  controllers: [SaleAgreementsController],
  providers: [SaleAgreementsService],
  exports: [SaleAgreementsService],
})
export class SaleAgreementsModule {}
