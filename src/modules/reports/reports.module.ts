import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ReportClass, ReportSchema } from './schemas/report.schema';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { User, UserSchema } from '../users/schemas/user.schema';
import { ActivitiesModule } from '../activities/activities.module';
import { Lead, LeadSchema } from '../leads/schemas/lead.schema';
import { Opportunity, OpportunitySchema } from '../opportunities/schemas/opportunity.schema';
import { Property, PropertySchema } from '../properties/schemas/property.schema';
import { Project, ProjectSchema } from '../projects/schemas/project.schema';
import { SiteVisit, SiteVisitSchema } from '../site-visits/schemas/site-visit.schema';
import { Contact, ContactSchema } from '../contacts/schemas/contact.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ReportClass.name, schema: ReportSchema },
      { name: User.name, schema: UserSchema },
      { name: Lead.name, schema: LeadSchema },
      { name: Opportunity.name, schema: OpportunitySchema },
      { name: Property.name, schema: PropertySchema },
      { name: Project.name, schema: ProjectSchema },
      { name: SiteVisit.name, schema: SiteVisitSchema },
      { name: Contact.name, schema: ContactSchema },
    ]),
    ActivitiesModule,
  ],
  controllers: [ReportsController],
  providers: [ReportsService],
  exports: [ReportsService],
})
export class ReportsModule {}

