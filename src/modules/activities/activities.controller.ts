import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiCreatedResponse,
  ApiOkResponse,
} from '@nestjs/swagger';
import { ActivitiesService } from './activities.service';
import { CreateActivityDto } from './dto/create-activity.dto';
import { QueryActivityDto } from './dto/query-activity.dto';
import { ActivityResponseDto } from './dto/activity-response.dto';
import { ResponseMessage } from '../../common/decorators/response-message.decorator';

@ApiTags('Activities')
@Controller('activities')
export class ActivitiesController {
  constructor(private readonly activitiesService: ActivitiesService) {}

  @Post()
  @ApiOperation({ summary: 'Log a new Activity event' })
  @ApiCreatedResponse({
    description: 'Activity successfully logged.',
    type: ActivityResponseDto,
  })
  @ResponseMessage('Activity logged successfully')
  async create(@Body() createActivityDto: CreateActivityDto) {
    return this.activitiesService.create(createActivityDto);
  }

  @Get()
  @ApiOperation({ summary: 'List and filter Activity logs' })
  @ApiOkResponse({
    description: 'Activity logs matching filters retrieved successfully.',
    type: [ActivityResponseDto],
  })
  @ResponseMessage('Activity logs retrieved successfully')
  async findAll(@Query() queryActivityDto: QueryActivityDto) {
    return this.activitiesService.findAll(queryActivityDto);
  }
}
