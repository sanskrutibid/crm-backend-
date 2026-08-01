import { Controller, Get, Post, Body, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { GoogleCalendarService } from './google-calendar.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ResponseMessage } from '../../common/decorators/response-message.decorator';

@ApiTags('Google Calendar')
@ApiBearerAuth('bearer')
@Controller('google-calendar')
export class GoogleCalendarController {
  constructor(private readonly googleCalendarService: GoogleCalendarService) {}

  @Get('auth-url')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Generate Google OAuth auth URL for Calendar integration' })
  @ResponseMessage('Google Calendar auth URL generated')
  getAuthUrl() {
    const url = this.googleCalendarService.generateAuthUrl();
    return { url };
  }

  @Post('connect')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Exchange Google auth code for tokens and link to user' })
  @ResponseMessage('Google Calendar connected successfully')
  async connect(@Body() body: { code: string }, @Req() req: any) {
    const userId = req.user.id;
    await this.googleCalendarService.connect(body.code, userId);
    return { success: true };
  }

  @Post('disconnect')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Disconnect Google Calendar integration' })
  @ResponseMessage('Google Calendar disconnected successfully')
  async disconnect(@Req() req: any) {
    const userId = req.user.id;
    await this.googleCalendarService.disconnect(userId);
    return { success: true };
  }

  @Get('status')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Retrieve Google Calendar connection status' })
  @ResponseMessage('Google Calendar status retrieved')
  async getStatus(@Req() req: any) {
    const userId = req.user.id;
    return this.googleCalendarService.getStatus(userId);
  }
}
