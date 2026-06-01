import {
  Body,
  Controller,
  Post,
  Get,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { OpportunitiesService } from './opportunities.service';
import { CreateOpportunityDto } from './dto/create-opportunity.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ResponseMessage } from '../../common/decorators/response-message.decorator';

@ApiTags('Opportunities')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('opportunities')
export class OpportunitiesController {
  constructor(private readonly opportunitiesService: OpportunitiesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new CRM Opportunity' })
  @ApiCreatedResponse({
    description: 'Opportunity successfully created.',
  })
  @ResponseMessage('Opportunity created successfully')
  async create(
    @Body() createOpportunityDto: CreateOpportunityDto,
    @Req() req: any,
  ) {
    const requestUserId = req.user.id;
    return this.opportunitiesService.create(
      createOpportunityDto,
      requestUserId,
    );
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
    @Req() req: any,
  ) {
    const requestUserId = req.user.id;
    return this.opportunitiesService.getMyOpportunities(
      requestUserId,
      sortBy,
      orderBy,
      Number(page),
      Number(limit),
    );
  }
}
