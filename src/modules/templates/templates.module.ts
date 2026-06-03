import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Template, TemplateSchema } from './schemas/template.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import { TemplatesController } from './templates.controller';
import { TemplatesService } from './templates.service';
import { AuthModule } from '../auth/auth.module';
import { ActivitiesModule } from '../activities/activities.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Template.name, schema: TemplateSchema },
      { name: User.name, schema: UserSchema },
    ]),
    AuthModule,
    ActivitiesModule,
  ],
  controllers: [TemplatesController],
  providers: [TemplatesService],
  exports: [TemplatesService],
})
export class TemplatesModule {}
