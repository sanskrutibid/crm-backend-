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
import { DocumentsService } from './documents.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';
import { QueryDocumentDto } from './dto/query-document.dto';
import { DocumentResponseDto } from './dto/document-response.dto';
import { ResponseMessage } from '../../common/decorators/response-message.decorator';

@ApiTags('Documents')
@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new Document' })
  @ApiCreatedResponse({
    description: 'Document successfully created.',
    type: DocumentResponseDto,
  })
  @ResponseMessage('Document created successfully')
  async create(@Body() createDto: CreateDocumentDto) {
    return this.documentsService.create(createDto, createDto.assignee);
  }

  @Get('legal')
  @ApiOperation({
    summary: 'List and filter Legal Documents templates',
    description: 'Returns only documents marked with Type "Legal".',
  })
  @ApiOkResponse({
    description: 'Legal Documents templates retrieved successfully.',
    type: [DocumentResponseDto],
  })
  @ResponseMessage('Legal Documents templates retrieved successfully')
  async findLegalDocuments(@Query() queryDto: QueryDocumentDto) {
    // Explicitly enforce type filter to 'Legal'
    const legalQuery: QueryDocumentDto = {
      ...queryDto,
      type: 'Legal',
    };
    return this.documentsService.findAll(legalQuery);
  }

  @Get()
  @ApiOperation({ summary: 'List and filter all Documents' })
  @ApiOkResponse({
    description: 'Documents retrieved successfully.',
    type: [DocumentResponseDto],
  })
  @ResponseMessage('Documents retrieved successfully')
  async findAll(@Query() queryDto: QueryDocumentDto) {
    return this.documentsService.findAll(queryDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Find a single Document by database ID' })
  @ApiOkResponse({
    description: 'Document found.',
    type: DocumentResponseDto,
  })
  @ResponseMessage('Document details retrieved successfully')
  async findOne(@Param('id') id: string) {
    return this.documentsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Modify an existing Document' })
  @ApiOkResponse({
    description: 'Document modified successfully.',
    type: DocumentResponseDto,
  })
  @ResponseMessage('Document updated successfully')
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateDocumentDto,
  ) {
    return this.documentsService.update(id, updateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a Document' })
  @ApiOkResponse({
    description: 'Document deleted successfully.',
  })
  @ResponseMessage('Document deleted successfully')
  async remove(@Param('id') id: string) {
    await this.documentsService.remove(id);
    return null;
  }
}
