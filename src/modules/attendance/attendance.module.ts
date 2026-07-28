import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Attendance, AttendanceSchema } from './schemas/attendance.schema';
import { LoginHistory, LoginHistorySchema } from '../login-history/schemas/login-history.schema';
import { AttendanceController } from './attendance.controller';
import { AttendanceService } from './attendance.service';
import { AuthModule } from '../auth/auth.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Attendance.name, schema: AttendanceSchema },
      { name: LoginHistory.name, schema: LoginHistorySchema },
    ]),
    AuthModule,
    ConfigModule,
  ],
  controllers: [AttendanceController],
  providers: [AttendanceService],
})
export class AttendanceModule {}
