import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { HolidaysController } from './holidays.controller';
import { HolidaysService } from './holidays.service';
import { Holiday, HolidaySchema } from './schemas/holiday.schema';
import { Employee, EmployeeSchema } from '../employees/schemas/employee.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import { EmailsModule } from '../emails/emails.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Holiday.name, schema: HolidaySchema },
      { name: Employee.name, schema: EmployeeSchema },
      { name: User.name, schema: UserSchema },
    ]),
    EmailsModule,
  ],
  controllers: [HolidaysController],
  providers: [HolidaysService],
  exports: [HolidaysService],
})
export class HolidaysModule {}
