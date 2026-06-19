import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Lead, LeadSchema } from './schemas/lead.schema';
import { Contact, ContactSchema } from '../contacts/schemas/contact.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import {
  SiteVisit,
  SiteVisitSchema,
} from '../site-visits/schemas/site-visit.schema';
import {
  LeadConversionLog,
  LeadConversionLogSchema,
} from './schemas/lead-conversion-log.schema';
import { LeadsController } from './leads.controller';
import { LeadsService } from './leads.service';
import { LeadsAIService } from './leads-ai.service';
import { AuthModule } from '../auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { ActivitiesModule } from '../activities/activities.module';
import { EmailsModule } from '../emails/emails.module';
import { SmsModule } from '../sms/sms.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Lead.name, schema: LeadSchema },
      { name: Contact.name, schema: ContactSchema },
      { name: User.name, schema: UserSchema },
      { name: SiteVisit.name, schema: SiteVisitSchema },
      { name: LeadConversionLog.name, schema: LeadConversionLogSchema },
    ]),
    AuthModule,
    ConfigModule,
    ActivitiesModule,
    EmailsModule,
    SmsModule,
  ],
  controllers: [LeadsController],
  providers: [LeadsService, LeadsAIService],
  exports: [LeadsService, LeadsAIService],
})
export class LeadsModule {}
