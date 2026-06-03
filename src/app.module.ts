import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { CrmCacheModule } from './common/cache/cache.module';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { LeadsModule } from './modules/leads/leads.module';
import { AttendanceModule } from './modules/attendance/attendance.module';
import { PropertiesModule } from './modules/properties/properties.module';
import { TasksModule } from './modules/tasks/tasks.module';
import { ActivitiesModule } from './modules/activities/activities.module';
import { ContactsModule } from './modules/contacts/contacts.module';
import { OpportunitiesModule } from './modules/opportunities/opportunities.module';
import { ProjectsModule } from './modules/projects/projects.module';
import { SiteVisitsModule } from './modules/site-visits/site-visits.module';
import { TemplatesModule } from './modules/templates/templates.module';
import { CampaignsModule } from './modules/campaigns/campaigns.module';
import { SaleAgreementsModule } from './modules/sale-agreements/sale-agreements.module';
import { RentAgreementsModule } from './modules/rent-agreements/rent-agreements.module';
import { DocumentsModule } from './modules/documents/documents.module';
import { ReportsModule } from './modules/reports/reports.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri:
          configService.get<string>('MONGO_URI') ||
          'mongodb://localhost:27017/crm_app',
      }),
    }),

    CrmCacheModule,

    UsersModule,
    AuthModule,
    LeadsModule,
    AttendanceModule,
    PropertiesModule,
    TasksModule,
    ActivitiesModule,
    ContactsModule,
    OpportunitiesModule,
    ProjectsModule,
    SiteVisitsModule,
    TemplatesModule,
    CampaignsModule,
    SaleAgreementsModule,
    RentAgreementsModule,
    DocumentsModule,
    ReportsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
