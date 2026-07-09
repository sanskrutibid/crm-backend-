import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Property, PropertySchema } from './schemas/property.schema';
import { Contact, ContactSchema } from '../contacts/schemas/contact.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import { PropertiesService } from './properties.service';
import { PropertiesController } from './properties.controller';
import { ActivitiesModule } from '../activities/activities.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Property.name, schema: PropertySchema },
      { name: Contact.name, schema: ContactSchema },
      { name: User.name, schema: UserSchema },
    ]),
    ActivitiesModule,
  ],
  controllers: [PropertiesController],
  providers: [PropertiesService],
  exports: [PropertiesService],
})
export class PropertiesModule {}
