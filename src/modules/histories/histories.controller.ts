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
import { HistoriesService } from './histories.service';
import { CreateHistoryDto } from './dto/create-history.dto';
import { UpdateHistoryDto } from './dto/update-history.dto';
import { QueryHistoryDto } from './dto/query-history.dto';
import { ResponseMessage } from '../../common/decorators/response-message.decorator';

@ApiTags('Client Histories')
@Controller('histories')
export class HistoriesController {
  constructor(private readonly historiesService: HistoriesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new client conversation history record' })
  @ApiCreatedResponse({
    description: 'History record successfully created.',
  })
  @ResponseMessage('History record created successfully')
  async create(@Body() createHistoryDto: CreateHistoryDto) {
    return this.historiesService.create(createHistoryDto);
  }

  @Get()
  @ApiOperation({ summary: 'List and filter client histories' })
  @ApiOkResponse({
    description: 'Histories retrieved successfully.',
  })
  @ResponseMessage('Histories retrieved successfully')
  async findAll(@Query() queryHistoryDto: QueryHistoryDto) {
    return this.historiesService.findAll(queryHistoryDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Find a single history record by database ID' })
  @ApiOkResponse({
    description: 'History record found.',
  })
  @ResponseMessage('History details retrieved successfully')
  async findOne(@Param('id') id: string) {
    return this.historiesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Modify an existing history record' })
  @ApiOkResponse({
    description: 'History record modified successfully.',
  })
  @ResponseMessage('History updated successfully')
  async update(
    @Param('id') id: string,
    @Body() updateHistoryDto: UpdateHistoryDto,
  ) {
    return this.historiesService.update(id, updateHistoryDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a history record' })
  @ApiOkResponse({
    description: 'History record deleted.',
  })
  @ResponseMessage('History deleted successfully')
  async remove(@Param('id') id: string) {
    await this.historiesService.remove(id);
    return null;
  }
}
