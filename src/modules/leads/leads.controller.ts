import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
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
import { LeadsService } from './leads.service';
import { CreateLeadDto } from './dto/create-lead.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';
import { QueryLeadDto } from './dto/query-lead.dto';
import { LeadResponseDto } from './dto/lead-response.dto';
import {
  ChangeLeadStatusDto,
  UpdateRequirementDto,
  SendLeadSmsDto,
  SendLeadEmailDto,
  LeadQuickNoteDto,
  SendProposalDto,
  LeadTermsConditionsDto,
  CreateSiteVisitDto,
} from './dto/lead-actions.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ResponseMessage } from '../../common/decorators/response-message.decorator';

@ApiTags('Leads')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('leads')
export class LeadsController {
  constructor(private readonly leadsService: LeadsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new CRM Lead' })
  @ApiCreatedResponse({
    description: 'Lead successfully created.',
    type: LeadResponseDto,
  })
  @ResponseMessage('Lead created successfully')
  async create(@Body() createLeadDto: CreateLeadDto, @Req() req: any) {
    const requestUserId = req.user.id;
    return this.leadsService.create(createLeadDto, requestUserId);
  }

  @Get()
  @ApiOperation({ summary: 'List and filter CRM Leads' })
  @ApiOkResponse({
    description: 'Leads matching filters retrieved successfully.',
    type: [LeadResponseDto],
  })
  @ResponseMessage('Leads retrieved successfully')
  async findAll(@Query() queryLeadDto: QueryLeadDto) {
    return this.leadsService.findAll(queryLeadDto);
  }

  @Get('today-followup')
  @ApiOperation({
    summary: "Today's Follow-Up Leads",
    description:
      'Returns all leads whose follow-up is scheduled for today, split into on-time and overdue buckets, along with summary counts by temperature (Hot/Warm/Cold). Optionally filter by assignedTo agent ID.',
  })
  @ApiOkResponse({
    description: "Today's follow-up leads with summary stats.",
    schema: {
      example: {
        summary: { totalToday: 12, hot: 3, warm: 5, cold: 4, overdue: 7 },
        todayLeads: [],
        overdueLeads: [],
      },
    },
  })
  @ApiQuery({
    name: 'assignedTo',
    required: false,
    description: 'Filter by agent/user MongoDB ID',
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    description: 'Field to sort leads by (default: FollowUp Date)',
    enum: [
      'Assigned Date',
      'Create Date',
      'FollowUp Date',
      'Updated Date',
      'Name',
    ],
    example: 'FollowUp Date',
  })
  @ApiQuery({
    name: 'orderBy',
    required: false,
    description: 'Sort direction (default: Asc)',
    enum: ['Asc', 'Desc'],
    example: 'Asc',
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
  @ResponseMessage("Today's follow-up leads retrieved successfully")
  async getTodayFollowup(
    @Query('assignedTo') assignedTo?: string,
    @Query('sortBy') sortBy = 'FollowUp Date',
    @Query('orderBy') orderBy: 'Asc' | 'Desc' = 'Asc',
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.leadsService.getTodayFollowup(
      assignedTo,
      sortBy,
      orderBy,
      Number(page),
      Number(limit),
    );
  }

  @Get('open-leads')
  @ApiOperation({
    summary: 'Open (Active) Leads',
    description:
      'Returns all In Progress leads — the full active pipeline. Includes Hot/Warm/Cold breakdown and Won/Lost totals for pipeline context.',
  })
  @ApiOkResponse({
    description: 'Open leads with pipeline summary stats.',
    schema: {
      example: {
        summary: { total: 45, hot: 10, warm: 20, cold: 15, won: 8, lost: 4 },
        leads: [],
      },
    },
  })
  @ApiQuery({
    name: 'assignedTo',
    required: false,
    description: 'Filter by agent/user MongoDB ID',
  })
  @ApiQuery({
    name: 'branch',
    required: false,
    description: 'Filter by branch name (partial match)',
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    description: 'Field to sort leads by (default: Create Date)',
    enum: [
      'Assigned Date',
      'Create Date',
      'FollowUp Date',
      'Updated Date',
      'Name',
    ],
    example: 'Create Date',
  })
  @ApiQuery({
    name: 'orderBy',
    required: false,
    description: 'Sort direction (default: Desc)',
    enum: ['Asc', 'Desc'],
    example: 'Desc',
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
  @ResponseMessage('Open leads retrieved successfully')
  async getOpenLeads(
    @Query('assignedTo') assignedTo?: string,
    @Query('branch') branch?: string,
    @Query('sortBy') sortBy = 'Create Date',
    @Query('orderBy') orderBy: 'Asc' | 'Desc' = 'Desc',
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.leadsService.getOpenLeads(
      assignedTo,
      branch,
      sortBy,
      orderBy,
      Number(page),
      Number(limit),
    );
  }

  @Post(':id/actions/change-status')
  @ApiOperation({
    summary: 'Change lead status (In Progress, Won, Lost) with final outcome',
  })
  @ResponseMessage('Lead status updated successfully')
  async changeStatus(
    @Param('id') id: string,
    @Body() changeLeadStatusDto: ChangeLeadStatusDto,
    @Req() req: any,
  ) {
    const requestUserId = req.user.id;
    return this.leadsService.changeStatus(
      id,
      changeLeadStatusDto,
      requestUserId,
    );
  }

  @Post(':id/actions/update-requirement')
  @ApiOperation({ summary: 'Update requirement of a lead' })
  @ResponseMessage('Lead requirement updated successfully')
  async updateRequirement(
    @Param('id') id: string,
    @Body() dto: UpdateRequirementDto,
    @Req() req: any,
  ) {
    const requestUserId = req.user.id;
    return this.leadsService.updateRequirement(id, dto, requestUserId);
  }

  @Post(':id/actions/send-sms')
  @ApiOperation({
    summary: 'Send scheduled or immediate SMS to a lead contact',
  })
  @ResponseMessage('SMS queued/sent successfully')
  async sendSms(
    @Param('id') id: string,
    @Body() dto: SendLeadSmsDto,
    @Req() req: any,
  ) {
    const requestUserId = req.user.id;
    return this.leadsService.sendSms(id, dto, requestUserId);
  }

  @Post(':id/actions/send-email')
  @ApiOperation({
    summary: 'Send scheduled or immediate Email to a lead contact',
  })
  @ResponseMessage('Email queued/sent successfully')
  async sendEmail(
    @Param('id') id: string,
    @Body() dto: SendLeadEmailDto,
    @Req() req: any,
  ) {
    const requestUserId = req.user.id;
    return this.leadsService.sendEmail(id, dto, requestUserId);
  }

  @Post(':id/actions/quick-note')
  @ApiOperation({ summary: 'Add quick note comment for lead profile context' })
  @ResponseMessage('Quick note added successfully')
  async addQuickNote(
    @Param('id') id: string,
    @Body() dto: LeadQuickNoteDto,
    @Req() req: any,
  ) {
    const requestUserId = req.user.id;
    return this.leadsService.addQuickNote(id, dto, requestUserId);
  }

  @Post(':id/actions/send-proposal')
  @ApiOperation({
    summary: 'Send rich proposal document to lead contact email',
  })
  @ResponseMessage('Proposal successfully sent')
  async sendProposal(
    @Param('id') id: string,
    @Body() dto: SendProposalDto,
    @Req() req: any,
  ) {
    const requestUserId = req.user.id;
    return this.leadsService.sendProposal(id, dto, requestUserId);
  }

  @Get(':id/actions/history')
  @ApiOperation({ summary: 'Retrieve activity history logs for a single lead' })
  @ResponseMessage('Lead history logs retrieved successfully')
  async getLeadHistory(@Param('id') id: string) {
    return this.leadsService.getLeadHistory(id);
  }

  @Post(':id/actions/terms-conditions')
  @ApiOperation({ summary: 'Email rich text Terms and Conditions to a lead' })
  @ResponseMessage('Terms and Conditions successfully emailed')
  async sendTermsConditions(
    @Param('id') id: string,
    @Body() dto: LeadTermsConditionsDto,
    @Req() req: any,
  ) {
    const requestUserId = req.user.id;
    return this.leadsService.sendTermsConditions(id, dto, requestUserId);
  }

  @Get(':id/actions/site-visits')
  @ApiOperation({
    summary: 'Retrieve scheduled property site visits for a single lead',
  })
  @ResponseMessage('Site visits retrieved successfully')
  async getSiteVisits(@Param('id') id: string) {
    return this.leadsService.getSiteVisits(id);
  }

  @Post(':id/actions/site-visits')
  @ApiOperation({
    summary: 'Schedule a new property site visit for a single lead',
  })
  @ResponseMessage('Site visit scheduled successfully')
  async createSiteVisit(
    @Param('id') id: string,
    @Body() dto: CreateSiteVisitDto,
    @Req() req: any,
  ) {
    const requestUserId = req.user.id;
    return this.leadsService.createSiteVisit(id, dto, requestUserId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Find a single CRM Lead by primary database ID' })
  @ApiOkResponse({
    description: 'Lead found.',
    type: LeadResponseDto,
  })
  @ResponseMessage('Lead details retrieved successfully')
  async findOne(@Param('id') id: string) {
    return this.leadsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Modify an existing CRM Lead' })
  @ApiOkResponse({
    description: 'Lead modified successfully.',
    type: LeadResponseDto,
  })
  @ResponseMessage('Lead updated successfully')
  async update(@Param('id') id: string, @Body() updateLeadDto: UpdateLeadDto) {
    return this.leadsService.update(id, updateLeadDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a CRM Lead' })
  @ApiOkResponse({
    description: 'Lead deleted.',
  })
  @ResponseMessage('Lead deleted successfully')
  async remove(@Param('id') id: string) {
    await this.leadsService.remove(id);
    return null;
  }
}
