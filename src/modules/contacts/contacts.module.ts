import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Contact, ContactSchema } from './schemas/contact.schema';
import { Audience, AudienceSchema } from './schemas/audience.schema';
import { EmailVerification, EmailVerificationSchema } from './schemas/email-verification.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import { ContactsService } from './contacts.service';
import { ContactsController } from './contacts.controller';
import { ActivitiesModule } from '../activities/activities.module';
import { EmailsModule } from '../emails/emails.module';
import { SmsModule } from '../sms/sms.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Contact.name, schema: ContactSchema },
      { name: Audience.name, schema: AudienceSchema },
      { name: User.name, schema: UserSchema },
      { name: EmailVerification.name, schema: EmailVerificationSchema },
    ]),
    ActivitiesModule,
    EmailsModule,
    SmsModule,
  ],
  controllers: [ContactsController],
  providers: [ContactsService],
  exports: [ContactsService],
})
export class ContactsModule {}
