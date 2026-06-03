import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SiteVisit, SiteVisitSchema } from './schemas/site-visit.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import { SiteVisitsController } from './site-visits.controller';
import { SiteVisitsService } from './site-visits.service';
import { AuthModule } from '../auth/auth.module';
import { ActivitiesModule } from '../activities/activities.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: SiteVisit.name, schema: SiteVisitSchema },
      { name: User.name, schema: UserSchema },
    ]),
    AuthModule,
    ActivitiesModule,
  ],
  controllers: [SiteVisitsController],
  providers: [SiteVisitsService],
  exports: [SiteVisitsService],
})
export class SiteVisitsModule {}
