import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import {
  Property,
  PropertySchema,
} from '../properties/schemas/property.schema';
import { Lead, LeadSchema } from '../leads/schemas/lead.schema';
import { Contact, ContactSchema } from '../contacts/schemas/contact.schema';
import {
  Opportunity,
  OpportunitySchema,
} from '../opportunities/schemas/opportunity.schema';
import {
  Project,
  ProjectSchema,
} from '../projects/schemas/project.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Property.name, schema: PropertySchema },
      { name: Lead.name, schema: LeadSchema },
      { name: Contact.name, schema: ContactSchema },
      { name: Opportunity.name, schema: OpportunitySchema },
      { name: Project.name, schema: ProjectSchema },
    ]),
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
  exports: [DashboardService],
})
export class DashboardModule {}
