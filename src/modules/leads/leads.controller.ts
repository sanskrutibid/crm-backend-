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
import { ApiBearerAuth, ApiTags, ApiOperation, ApiCreatedResponse, ApiOkResponse } from '@nestjs/swagger';
import { LeadsService } from './leads.service';
import { CreateLeadDto } from './dto/create-lead.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';
import { QueryLeadDto } from './dto/query-lead.dto';
import { LeadResponseDto } from './dto/lead-response.dto';
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
