import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { UsersModule } from '../users/users.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { LoginHistoryModule } from '../login-history/login-history.module';
import { EmployeesModule } from '../employees/employees.module';

@Module({
  imports: [UsersModule, ConfigModule, LoginHistoryModule, EmployeesModule],
  controllers: [AuthController],
  providers: [AuthService, JwtAuthGuard],
  exports: [AuthService, JwtAuthGuard],
})
export class AuthModule {}
