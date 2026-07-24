import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiCreatedResponse,
} from '@nestjs/swagger';
import { EmailsService } from './emails.service';
import { ScheduleEmailDto } from './dto/schedule-email.dto';
import { QueryEmailDto } from './dto/query-email.dto';
import { SaveSmtpConfigDto } from './dto/smtp-config.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ResponseMessage } from '../../common/decorators/response-message.decorator';

@ApiTags('Emails')
@Controller('emails')
export class EmailsController {
  constructor(private readonly emailsService: EmailsService) {}

  @Post('smtp-config')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Save or update user SMTP configuration' })
  @ApiCreatedResponse({ description: 'SMTP configuration saved successfully.' })
  @ResponseMessage('SMTP configuration saved successfully')
  async saveSmtpConfig(@Body() dto: SaveSmtpConfigDto, @Req() req: any) {
    const userId = req.user.id || req.user._id;
    return this.emailsService.saveSmtpConfig(userId, dto);
  }

  @Get('smtp-config')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get user SMTP configuration' })
  @ApiOkResponse({ description: 'SMTP configuration retrieved successfully.' })
  @ResponseMessage('SMTP configuration retrieved successfully')
  async getSmtpConfig(@Req() req: any) {
    const userId = req.user.id || req.user._id;
    return this.emailsService.getSmtpConfig(userId);
  }

  @Delete('smtp-config')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Delete user SMTP configuration' })
  @ApiOkResponse({ description: 'SMTP configuration deleted successfully.' })
  @ResponseMessage('SMTP configuration deleted successfully')
  async deleteSmtpConfig(@Req() req: any) {
    const userId = req.user.id || req.user._id;
    await this.emailsService.deleteSmtpConfig(userId);
    return { success: true };
  }

  @Post('schedule')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Schedule a new email campaign' })
  @ApiCreatedResponse({ description: 'Email successfully scheduled.' })
  @ResponseMessage('Email scheduled successfully')
  async schedule(@Body() dto: ScheduleEmailDto, @Req() req: any) {
    dto.createdBy = req.user.id || req.user._id;
    return this.emailsService.schedule(dto);
  }

  @Get('reports')
  @ApiOperation({
    summary:
      'List and filter scheduled/sent email reports with search, sorting, and pagination',
  })
  @ApiOkResponse({ description: 'Email reports retrieved successfully.' })
  @ResponseMessage('Email reports retrieved successfully')
  async findAll(@Query() query: QueryEmailDto) {
    return this.emailsService.findAll(query);
  }

  @Get('reports/:id')
  @ApiOperation({ summary: 'Get details of a single email report' })
  @ApiOkResponse({
    description: 'Email report details retrieved successfully.',
  })
  @ResponseMessage('Email report details retrieved successfully')
  async findOne(@Param('id') id: string) {
    return this.emailsService.findOne(id);
  }

  @Get('track/:id')
  @ApiOperation({
    summary: 'Track email open via 1x1 transparent tracking pixel',
  })
  async trackOpen(@Param('id') id: string, @Req() req: any, @Res() res: any) {
    const ip = req.ip || req.headers['x-forwarded-for'] || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';

    // Log the open event
    await this.emailsService.trackOpen(id, ip, userAgent);

    // Serve a 1x1 transparent GIF image
    const trackingPixelBase64 =
      'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
    const buffer = Buffer.from(trackingPixelBase64, 'base64');

    res.header('Content-Type', 'image/gif');
    res.header(
      'Cache-Control',
      'no-store, no-cache, must-revalidate, max-age=0',
    );
    res.header('Pragma', 'no-cache');
    res.header('Expires', '0');
    res.send(buffer);
  }

  @Post('smtp-config/verify')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Verify SMTP connection credentials' })
  @ApiOkResponse({ description: 'SMTP verification result status' })
  @ResponseMessage('SMTP verification executed')
  async verifySmtpConfig(@Body() dto: SaveSmtpConfigDto, @Req() req: any) {
    const userId = req.user.id || req.user._id;
    return this.emailsService.verifySmtpConfig(userId, dto);
  }

  @Get(':id/html')
  @ApiOperation({ summary: 'View email body content as raw HTML' })
  async viewEmailHtml(@Param('id') id: string, @Res() res: any) {
    const email = await this.emailsService.findOne(id);
    res.header('Content-Type', 'text/html');
    res.send(email.body);
  }
}
