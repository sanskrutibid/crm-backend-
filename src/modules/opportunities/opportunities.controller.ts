import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { OpportunitiesService } from './opportunities.service';
import { CreateOpportunityDto } from './dto/create-opportunity.dto';
import { UpdateOpportunityDto } from './dto/update-opportunity.dto';
import { QueryOpportunityDto } from './dto/query-opportunity.dto';
import { ResponseMessage } from '../../common/decorators/response-message.decorator';

@ApiTags('Opportunities')
@Controller('opportunities')
export class OpportunitiesController {
  constructor(private readonly opportunitiesService: OpportunitiesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new CRM Opportunity' })
  @ApiCreatedResponse({
    description: 'Opportunity successfully created.',
  })
  @ResponseMessage('Opportunity created successfully')
  async create(@Body() createOpportunityDto: CreateOpportunityDto) {
    return this.opportunitiesService.create(createOpportunityDto);
  }

  @Get()
  @ApiOperation({ summary: 'List and filter CRM Opportunities' })
  @ApiOkResponse({
    description: 'Opportunities matching filters retrieved successfully.',
  })
  @ResponseMessage('Opportunities retrieved successfully')
  async findAll(@Query() queryOpportunityDto: QueryOpportunityDto) {
    return this.opportunitiesService.findAll(queryOpportunityDto);
  }

  @Get('my-opportunities')
  @ApiOperation({
    summary: 'Get My Opportunities',
    description:
      'Returns opportunities assigned to or created by the logged-in user, with optional sorting and pagination.',
  })
  @ApiOkResponse({
    description: 'My Opportunities retrieved successfully.',
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    enum: [
      'Assigned Date',
      'Create Date',
      'FollowUp Date',
      'Updated Date',
      'Name',
    ],
    default: 'Create Date',
  })
  @ApiQuery({
    name: 'orderBy',
    required: false,
    enum: ['Asc', 'Desc'],
    default: 'Desc',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Page number (default: 1)',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Records per page (default: 20)',
    example: 20,
  })
  @ResponseMessage('My Opportunities retrieved successfully')
  async getMyOpportunities(
    @Query('sortBy') sortBy = 'Create Date',
    @Query('orderBy') orderBy: 'Asc' | 'Desc' = 'Desc',
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.opportunitiesService.getMyOpportunities(
      sortBy,
      orderBy,
      Number(page),
      Number(limit),
    );
  }

  @Get('today-followup')
  @ApiOperation({
    summary: "Today's Follow-Up Opportunities",
    description:
      'Returns opportunities scheduled for today, split into on-time and overdue buckets.',
  })
  @ApiOkResponse({
    description: "Today's follow-up opportunities retrieved successfully.",
  })
  @ApiQuery({
    name: 'assignedTo',
    required: false,
    description: 'Filter by agent user ID',
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    enum: [
      'Assigned Date',
      'Create Date',
      'FollowUp Date',
      'Updated Date',
      'Name',
    ],
    default: 'FollowUp Date',
  })
  @ApiQuery({
    name: 'orderBy',
    required: false,
    enum: ['Asc', 'Desc'],
    default: 'Asc',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    example: 20,
  })
  @ResponseMessage("Today's follow-up opportunities retrieved successfully")
  async getTodayFollowup(
    @Query('assignedTo') assignedTo?: string,
    @Query('sortBy') sortBy = 'FollowUp Date',
    @Query('orderBy') orderBy: 'Asc' | 'Desc' = 'Asc',
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.opportunitiesService.getTodayFollowup(
      assignedTo,
      sortBy,
      orderBy,
      Number(page),
      Number(limit),
    );
  }

  @Get('open')
  @ApiOperation({
    summary: 'Open (Active) Opportunities',
    description: 'Returns all In Progress opportunities pipeline.',
  })
  @ApiOkResponse({
    description: 'Open opportunities retrieved successfully.',
  })
  @ApiQuery({
    name: 'assignedTo',
    required: false,
    description: 'Filter by agent user ID',
  })
  @ApiQuery({
    name: 'branch',
    required: false,
    description: 'Filter by branch name',
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    enum: [
      'Assigned Date',
      'Create Date',
      'FollowUp Date',
      'Updated Date',
      'Name',
    ],
    default: 'Create Date',
  })
  @ApiQuery({
    name: 'orderBy',
    required: false,
    enum: ['Asc', 'Desc'],
    default: 'Desc',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    example: 20,
  })
  @ResponseMessage('Open opportunities retrieved successfully')
  async getOpenOpportunities(
    @Query('assignedTo') assignedTo?: string,
    @Query('branch') branch?: string,
    @Query('sortBy') sortBy = 'Create Date',
    @Query('orderBy') orderBy: 'Asc' | 'Desc' = 'Desc',
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.opportunitiesService.getOpenOpportunities(
      assignedTo,
      branch,
      sortBy,
      orderBy,
      Number(page),
      Number(limit),
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Find a single CRM Opportunity by ID' })
  @ApiOkResponse({
    description: 'Opportunity found.',
  })
  @ResponseMessage('Opportunity details retrieved successfully')
  async findOne(@Param('id') id: string) {
    return this.opportunitiesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Modify an existing CRM Opportunity' })
  @ApiOkResponse({
    description: 'Opportunity modified successfully.',
  })
  @ResponseMessage('Opportunity updated successfully')
  async update(
    @Param('id') id: string,
    @Body() updateOpportunityDto: UpdateOpportunityDto,
  ) {
    return this.opportunitiesService.update(id, updateOpportunityDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a CRM Opportunity' })
  @ApiOkResponse({
    description: 'Opportunity deleted.',
  })
  @ResponseMessage('Opportunity deleted successfully')
  async remove(@Param('id') id: string) {
    await this.opportunitiesService.remove(id);
    return null;
  }
}
