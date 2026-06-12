import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DatabackupController } from './databackup.controller';
import { DatabackupService } from './databackup.service';
import { BackupLog, BackupLogSchema } from './schemas/backup-log.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: BackupLog.name, schema: BackupLogSchema },
    ]),
  ],
  controllers: [DatabackupController],
  providers: [DatabackupService],
})
export class DatabackupModule {}
