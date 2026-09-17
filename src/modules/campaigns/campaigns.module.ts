import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Campaign, CampaignSchema } from './schemas/campaign.schema';
import { Contact, ContactSchema } from '../contacts/schemas/contact.schema';
import { CampaignsController } from './campaigns.controller';
import { CampaignsService } from './campaigns.service';
import { ActivitiesModule } from '../activities/activities.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Campaign.name, schema: CampaignSchema },
      { name: Contact.name, schema: ContactSchema },
    ]),
    ActivitiesModule,
  ],
  controllers: [CampaignsController],
  providers: [CampaignsService],
  exports: [CampaignsService],
})
export class CampaignsModule {}
