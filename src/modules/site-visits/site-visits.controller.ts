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
} from '@nestjs/swagger';
import { SiteVisitsService } from './site-visits.service';
import { CreateSiteVisitDto } from './dto/create-site-visit.dto';
import { UpdateSiteVisitDto } from './dto/update-site-visit.dto';
import { QuerySiteVisitDto } from './dto/query-site-visit.dto';
import { SiteVisitResponseDto } from './dto/site-visit-response.dto';
import { ResponseMessage } from '../../common/decorators/response-message.decorator';

@ApiTags('Site Visits')
@Controller('site-visits')
export class SiteVisitsController {
  constructor(private readonly siteVisitsService: SiteVisitsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new property Site Visit' })
  @ApiCreatedResponse({
    description: 'Site visit successfully created.',
    type: SiteVisitResponseDto,
  })
  @ResponseMessage('Site visit created successfully')
  async create(@Body() createDto: CreateSiteVisitDto) {
    return this.siteVisitsService.create(createDto);
  }

  @Get()
  @ApiOperation({
    summary: 'List and filter Site Visits with search, sorting, and pagination',
  })
  @ApiOkResponse({
    description:
      'Site visits matching search and filter parameters retrieved successfully.',
    type: [SiteVisitResponseDto],
  })
  @ResponseMessage('Site visits retrieved successfully')
  async findAll(@Query() query: QuerySiteVisitDto) {
    return this.siteVisitsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Find a single Site Visit record by database ID' })
  @ApiOkResponse({
    description: 'Site visit details retrieved successfully.',
    type: SiteVisitResponseDto,
  })
  @ResponseMessage('Site visit details retrieved successfully')
  async findOne(@Param('id') id: string) {
    return this.siteVisitsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Modify an existing Site Visit record' })
  @ApiOkResponse({
    description: 'Site visit successfully modified.',
    type: SiteVisitResponseDto,
  })
  @ResponseMessage('Site visit updated successfully')
  async update(@Param('id') id: string, @Body() updateDto: UpdateSiteVisitDto) {
    return this.siteVisitsService.update(id, updateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a Site Visit record' })
  @ApiOkResponse({
    description: 'Site visit successfully deleted.',
  })
  @ResponseMessage('Site visit deleted successfully')
  async remove(@Param('id') id: string) {
    await this.siteVisitsService.remove(id);
    return null;
  }

  @Post(':id/verify-otp')
  @ApiOperation({ summary: 'Verify OTP for a Site Visit' })
  @ResponseMessage('OTP verified successfully')
  async verifyOtp(@Param('id') id: string, @Body('otp') otp: string) {
    return this.siteVisitsService.verifyOtp(id, otp);
  }
}
