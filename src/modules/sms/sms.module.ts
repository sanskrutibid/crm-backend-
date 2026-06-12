import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Sms, SmsSchema } from './schemas/sms.schema';
import { SmsController } from './sms.controller';
import { SmsService } from './sms.service';

@Module({
  imports: [MongooseModule.forFeature([{ name: Sms.name, schema: SmsSchema }])],
  controllers: [SmsController],
  providers: [SmsService],
  exports: [SmsService],
})
export class SmsModule {}
