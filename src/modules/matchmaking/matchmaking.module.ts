import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MatchmakingController } from './matchmaking.controller';
import { MatchmakingService } from './matchmaking.service';
import { Opportunity, OpportunitySchema } from '../opportunities/schemas/opportunity.schema';
import { Property, PropertySchema } from '../properties/schemas/property.schema';
import { Project, ProjectSchema } from '../projects/schemas/project.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Opportunity.name, schema: OpportunitySchema },
      { name: Property.name, schema: PropertySchema },
      { name: Project.name, schema: ProjectSchema },
    ]),
  ],
  controllers: [MatchmakingController],
  providers: [MatchmakingService],
  exports: [MatchmakingService],
})
export class MatchmakingModule {}
