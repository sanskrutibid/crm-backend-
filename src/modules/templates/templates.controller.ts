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
import { TemplatesService } from './templates.service';
import { CreateTemplateDto } from './dto/create-template.dto';
import { UpdateTemplateDto } from './dto/update-template.dto';
import { QueryTemplateDto } from './dto/query-template.dto';
import { TemplateResponseDto } from './dto/template-response.dto';
import { ResponseMessage } from '../../common/decorators/response-message.decorator';

@ApiTags('Templates')
@Controller('templates')
export class TemplatesController {
  constructor(private readonly templatesService: TemplatesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new campaign layout Template' })
  @ApiCreatedResponse({
    description: 'Template successfully created.',
    type: TemplateResponseDto,
  })
  @ResponseMessage('Template created successfully')
  async create(@Body() createDto: CreateTemplateDto) {
    return this.templatesService.create(createDto);
  }

  @Get()
  @ApiOperation({ summary: 'List and filter Templates with search, sorting, and pagination' })
  @ApiOkResponse({
    description: 'Templates retrieved successfully.',
    type: [TemplateResponseDto],
  })
  @ResponseMessage('Templates retrieved successfully')
  async findAll(@Query() query: QueryTemplateDto) {
    return this.templatesService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Find a single Template by MongoDB ID' })
  @ApiOkResponse({
    description: 'Template details retrieved successfully.',
    type: TemplateResponseDto,
  })
  @ResponseMessage('Template details retrieved successfully')
  async findOne(@Param('id') id: string) {
    return this.templatesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Modify an existing Template record' })
  @ApiOkResponse({
    description: 'Template successfully modified.',
    type: TemplateResponseDto,
  })
  @ResponseMessage('Template updated successfully')
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateTemplateDto,
  ) {
    return this.templatesService.update(id, updateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a Template record' })
  @ApiOkResponse({
    description: 'Template successfully deleted.',
  })
  @ResponseMessage('Template deleted successfully')
  async remove(@Param('id') id: string) {
    await this.templatesService.remove(id);
    return null;
  }
}
