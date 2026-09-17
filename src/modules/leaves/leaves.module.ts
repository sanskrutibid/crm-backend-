import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { LeavesController } from './leaves.controller';
import { LeavesService } from './leaves.service';
import { Leave, LeaveSchema } from './schemas/leave.schema';
import { EmailsModule } from '../emails/emails.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Leave.name, schema: LeaveSchema },
    ]),
    EmailsModule,
  ],
  controllers: [LeavesController],
  providers: [LeavesService],
  exports: [LeavesService],
})
export class LeavesModule {}
