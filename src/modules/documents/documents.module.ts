import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DocumentClass, DocumentSchema } from './schemas/document.schema';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';
import { User, UserSchema } from '../users/schemas/user.schema';
import { ActivitiesModule } from '../activities/activities.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: DocumentClass.name, schema: DocumentSchema },
      { name: User.name, schema: UserSchema },
    ]),
    ActivitiesModule,
  ],
  controllers: [DocumentsController],
  providers: [DocumentsService],
  exports: [DocumentsService],
})
export class DocumentsModule {}
