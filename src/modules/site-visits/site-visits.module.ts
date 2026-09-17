import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SiteVisit, SiteVisitSchema } from './schemas/site-visit.schema';
import { Contact, ContactSchema } from '../contacts/schemas/contact.schema';
import { Lead, LeadSchema } from '../leads/schemas/lead.schema';
import { Template, TemplateSchema } from '../templates/schemas/template.schema';
import { SiteVisitsController } from './site-visits.controller';
import { SiteVisitsService } from './site-visits.service';
import { AuthModule } from '../auth/auth.module';
import { ActivitiesModule } from '../activities/activities.module';
import { SmsModule } from '../sms/sms.module';
import { EmailsModule } from '../emails/emails.module';
import { GoogleCalendarModule } from '../google-calendar/google-calendar.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: SiteVisit.name, schema: SiteVisitSchema },
      { name: Contact.name, schema: ContactSchema },
      { name: Lead.name, schema: LeadSchema },
      { name: Template.name, schema: TemplateSchema },
    ]),
    AuthModule,
    ActivitiesModule,
    SmsModule,
    EmailsModule,
    GoogleCalendarModule,
  ],
  controllers: [SiteVisitsController],
  providers: [SiteVisitsService],
  exports: [SiteVisitsService],
})
export class SiteVisitsModule {}
