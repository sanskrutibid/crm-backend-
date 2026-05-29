import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Opportunity, OpportunitySchema } from './schemas/opportunity.schema';
import { Contact, ContactSchema } from '../contacts/schemas/contact.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import { OpportunitiesController } from './opportunities.controller';
import { OpportunitiesService } from './opportunities.service';
import { AuthModule } from '../auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { ActivitiesModule } from '../activities/activities.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Opportunity.name, schema: OpportunitySchema },
      { name: Contact.name, schema: ContactSchema },
      { name: User.name, schema: UserSchema },
    ]),
    AuthModule,
    ConfigModule,
    ActivitiesModule,
  ],
  controllers: [OpportunitiesController],
  providers: [OpportunitiesService],
  exports: [OpportunitiesService],
})
export class OpportunitiesModule {}
