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
  Res,
  Header,
} from '@nestjs/common';
import {
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
  ConvertContactsToLeadsDto,
} from './dto/lead-actions.dto';
import {
  SendGroupSmsDto,
  SendGroupEmailDto,
  GroupDeleteDto,
} from './dto/bulk-actions.dto';
import { ResponseMessage } from '../../common/decorators/response-message.decorator';

@ApiTags('Leads')
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
  async create(@Body() createLeadDto: CreateLeadDto) {
    return this.leadsService.create(createLeadDto);
  }

  @Post('actions/convert-contacts')
  @ApiOperation({ summary: 'Convert one or more contacts to CRM Leads' })
  @ResponseMessage('Contacts successfully converted to Leads')
  async convertContactsToLeads(
    @Body() convertContactsToLeadsDto: ConvertContactsToLeadsDto,
    @Req() req: any,
  ) {
    const ip = req.ip || req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '127.0.0.1';
    return this.leadsService.convertContactsToLeads(convertContactsToLeadsDto, undefined, ip);
  }

  @Get('actions/convert-history')
  @ApiOperation({ summary: 'Get history of contact-to-lead conversions' })
  @ResponseMessage('Conversion history retrieved successfully')
  async getConversionHistory(@Query('contactId') contactId?: string) {
    return this.leadsService.getConversionHistory(contactId);
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
  ) {
    return this.leadsService.changeStatus(id, changeLeadStatusDto);
  }

  @Post(':id/actions/update-requirement')
  @ApiOperation({ summary: 'Update requirement of a lead' })
  @ResponseMessage('Lead requirement updated successfully')
  async updateRequirement(
    @Param('id') id: string,
    @Body() dto: UpdateRequirementDto,
  ) {
    return this.leadsService.updateRequirement(id, dto);
  }

  @Post(':id/actions/send-sms')
  @ApiOperation({
    summary: 'Send scheduled or immediate SMS to a lead contact',
  })
  @ResponseMessage('SMS queued/sent successfully')
  async sendSms(@Param('id') id: string, @Body() dto: SendLeadSmsDto) {
    return this.leadsService.sendSms(id, dto);
  }

  @Post(':id/actions/send-email')
  @ApiOperation({
    summary: 'Send scheduled or immediate Email to a lead contact',
  })
  @ResponseMessage('Email queued/sent successfully')
  async sendEmail(@Param('id') id: string, @Body() dto: SendLeadEmailDto) {
    return this.leadsService.sendEmail(id, dto);
  }

  @Post(':id/actions/quick-note')
  @ApiOperation({ summary: 'Add quick note comment for lead profile context' })
  @ResponseMessage('Quick note added successfully')
  async addQuickNote(@Param('id') id: string, @Body() dto: LeadQuickNoteDto) {
    return this.leadsService.addQuickNote(id, dto);
  }

  @Post(':id/actions/send-proposal')
  @ApiOperation({
    summary: 'Send rich proposal document to lead contact email',
  })
  @ResponseMessage('Proposal successfully sent')
  async sendProposal(@Param('id') id: string, @Body() dto: SendProposalDto) {
    return this.leadsService.sendProposal(id, dto);
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
  ) {
    return this.leadsService.sendTermsConditions(id, dto);
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
  ) {
    return this.leadsService.createSiteVisit(id, dto);
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

  @Post('actions/send-sms')
  @ApiOperation({ summary: 'Send group SMS to selected/all leads' })
  @ResponseMessage('Group SMS sent successfully')
  async sendGroupSms(@Body() dto: SendGroupSmsDto) {
    return this.leadsService.sendGroupSms(dto);
  }

  @Post('actions/send-email')
  @ApiOperation({ summary: 'Send group Email to selected/all leads' })
  @ResponseMessage('Group email sent successfully')
  async sendGroupEmail(@Body() dto: SendGroupEmailDto) {
    return this.leadsService.sendGroupEmail(dto);
  }

  @Post('actions/group-delete')
  @ApiOperation({ summary: 'Bulk delete leads matching selection or filters' })
  @ResponseMessage('Leads bulk deleted successfully')
  async groupDelete(@Body() dto: GroupDeleteDto) {
    return this.leadsService.groupDelete(dto);
  }

  @Get('actions/download')
  @Header('Content-Type', 'text/csv')
  @Header('Content-Disposition', 'attachment; filename="leads.csv"')
  @ApiOperation({ summary: 'Export and download CRM Leads in CSV format' })
  async downloadExcel(@Query() query: QueryLeadDto, @Res() reply: any) {
    const csvContent = await this.leadsService.downloadExcel(query);
    reply.send(csvContent);
  }

  @Post('actions/google-drive')
  @ApiOperation({ summary: 'Export and upload CRM Leads to Google Drive' })
  @ResponseMessage('Leads exported to Google Drive successfully')
  async uploadToGoogleDrive(@Body() body: { limit?: number; filters?: any }) {
    return this.leadsService.uploadToGoogleDrive(body.filters, body.limit);
  }

  @Post('actions/import')
  @ApiOperation({ summary: 'Import leads in bulk from spreadsheet data' })
  @ResponseMessage('Leads imported successfully')
  async importLeads(@Body() leads: any[]) {
    return this.leadsService.importLeads(leads);
  }
}
