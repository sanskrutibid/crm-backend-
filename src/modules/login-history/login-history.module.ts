import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { LoginHistory, LoginHistorySchema } from './schemas/login-history.schema';
import { LoginHistoryController } from './login-history.controller';
import { LoginHistoryService } from './login-history.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: LoginHistory.name, schema: LoginHistorySchema },
    ]),
    ConfigModule,
  ],
  controllers: [LoginHistoryController],
  providers: [LoginHistoryService, JwtAuthGuard],
  exports: [LoginHistoryService],
})
export class LoginHistoryModule {}
