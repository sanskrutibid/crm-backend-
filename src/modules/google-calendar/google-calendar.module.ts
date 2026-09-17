import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { GoogleCalendarService } from './google-calendar.service';
import { GoogleCalendarController } from './google-calendar.controller';
import { User, UserSchema } from '../users/schemas/user.schema';
import { Lead, LeadSchema } from '../leads/schemas/lead.schema';
import { SiteVisit, SiteVisitSchema } from '../site-visits/schemas/site-visit.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Lead.name, schema: LeadSchema },
      { name: SiteVisit.name, schema: SiteVisitSchema },
    ]),
  ],
  controllers: [GoogleCalendarController],
  providers: [GoogleCalendarService],
  exports: [GoogleCalendarService],
})
export class GoogleCalendarModule {}
