import { Controller, Post, Get, Body, Param, Query } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiCreatedResponse,
} from '@nestjs/swagger';
import { SmsService } from './sms.service';
import { ScheduleSmsDto } from './dto/schedule-sms.dto';
import { QuerySmsDto } from './dto/query-sms.dto';
import { ResponseMessage } from '../../common/decorators/response-message.decorator';

@ApiTags('SMS')
@Controller('sms')
export class SmsController {
  constructor(private readonly smsService: SmsService) {}

  @Post('schedule')
  @ApiOperation({ summary: 'Schedule a new SMS campaign using Twilio' })
  @ApiCreatedResponse({ description: 'SMS successfully scheduled.' })
  @ResponseMessage('SMS scheduled successfully')
  async schedule(@Body() dto: ScheduleSmsDto) {
    return this.smsService.schedule(dto);
  }

  @Get('reports')
  @ApiOperation({
    summary:
      'List and filter scheduled/sent SMS reports with search, sorting, and pagination',
  })
  @ApiOkResponse({ description: 'SMS reports retrieved successfully.' })
  @ResponseMessage('SMS reports retrieved successfully')
  async findAll(@Query() query: QuerySmsDto) {
    return this.smsService.findAll(query);
  }

  @Get('reports/:id')
  @ApiOperation({ summary: 'Get details of a single SMS report' })
  @ApiOkResponse({ description: 'SMS report details retrieved successfully.' })
  @ResponseMessage('SMS report details retrieved successfully')
  async findOne(@Param('id') id: string) {
    return this.smsService.findOne(id);
  }
}
