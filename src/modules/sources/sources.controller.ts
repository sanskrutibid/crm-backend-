import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SourcesService } from './sources.service';
import { CreateSourceDto } from './dto/create-source.dto';
import { UpdateSourceDto } from './dto/update-source.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ResponseMessage } from '../../common/decorators/response-message.decorator';

@ApiTags('Sources')
// @ApiBearerAuth('bearer')
@Controller('sources')
// @UseGuards(JwtAuthGuard)
export class SourcesController {
  constructor(private readonly sourcesService: SourcesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new source' })
  @ResponseMessage('Source created successfully')
  async create(@Body() createSourceDto: CreateSourceDto) {
    return this.sourcesService.create(createSourceDto);
  }

  @Get()
  @ApiOperation({ summary: 'Retrieve all sources' })
  @ResponseMessage('Sources retrieved successfully')
  async findAll() {
    return this.sourcesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single source detail' })
  @ResponseMessage('Source retrieved successfully')
  async findOne(@Param('id') id: string) {
    return this.sourcesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update source details' })
  @ResponseMessage('Source updated successfully')
  async update(
    @Param('id') id: string,
    @Body() updateSourceDto: UpdateSourceDto,
  ) {
    return this.sourcesService.update(id, updateSourceDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a source' })
  @ResponseMessage('Source deleted successfully')
  async remove(@Param('id') id: string) {
    await this.sourcesService.remove(id);
    return { success: true };
  }
}
