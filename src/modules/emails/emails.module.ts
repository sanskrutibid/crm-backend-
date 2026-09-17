import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Email, EmailSchema } from './schemas/email.schema';
import { SmtpConfig, SmtpConfigSchema } from './schemas/smtp-config.schema';
import { EmailsController } from './emails.controller';
import { EmailsService } from './emails.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Email.name, schema: EmailSchema },
      { name: SmtpConfig.name, schema: SmtpConfigSchema },
    ]),
  ],
  controllers: [EmailsController],
  providers: [EmailsService],
  exports: [EmailsService],
})
export class EmailsModule {}
