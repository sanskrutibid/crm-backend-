import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { History, HistorySchema } from './schemas/history.schema';
import { Contact, ContactSchema } from '../contacts/schemas/contact.schema';
import { Project, ProjectSchema } from '../projects/schemas/project.schema';
import { HistoriesService } from './histories.service';
import { HistoriesController } from './histories.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: History.name, schema: HistorySchema },
      { name: Contact.name, schema: ContactSchema },
      { name: Project.name, schema: ProjectSchema },
    ]),
  ],
  controllers: [HistoriesController],
  providers: [HistoriesService],
  exports: [HistoriesService],
})
export class HistoriesModule {}
