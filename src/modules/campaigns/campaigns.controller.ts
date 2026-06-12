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
  ApiOkResponse,
  ApiCreatedResponse,
} from '@nestjs/swagger';
import { CampaignsService } from './campaigns.service';
import { CreateCampaignDto } from './dto/create-campaign.dto';
import { UpdateCampaignDto } from './dto/update-campaign.dto';
import { QueryCampaignDto } from './dto/query-campaign.dto';
import { ResponseMessage } from '../../common/decorators/response-message.decorator';

@ApiTags('Campaigns')
@Controller('campaigns')
export class CampaignsController {
  constructor(private readonly campaignsService: CampaignsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new marketing Campaign' })
  @ApiCreatedResponse({ description: 'Campaign successfully created.' })
  @ResponseMessage('Campaign created successfully')
  async create(@Body() createDto: CreateCampaignDto) {
    return this.campaignsService.create(createDto);
  }

  @Get()
  @ApiOperation({ summary: 'List and filter Campaigns' })
  @ResponseMessage('Campaigns retrieved successfully')
  async findAll(@Query() query: QueryCampaignDto) {
    return this.campaignsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Retrieve details of a single Campaign' })
  @ResponseMessage('Campaign details retrieved successfully')
  async findOne(@Param('id') id: string) {
    return this.campaignsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Modify an existing Campaign' })
  @ResponseMessage('Campaign updated successfully')
  async update(@Param('id') id: string, @Body() updateDto: UpdateCampaignDto) {
    return this.campaignsService.update(id, updateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a Campaign' })
  @ResponseMessage('Campaign deleted successfully')
  async remove(@Param('id') id: string) {
    await this.campaignsService.remove(id);
    return null;
  }
}
