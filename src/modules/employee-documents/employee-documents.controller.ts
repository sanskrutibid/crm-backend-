import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse, ApiCreatedResponse } from '@nestjs/swagger';
import { EmployeeDocumentsService } from './employee-documents.service';
import { CreateEmployeeDocumentDto } from './dto/create-employee-document.dto';
import { UpdateEmployeeDocumentDto } from './dto/update-employee-document.dto';

@ApiTags('Employee Documents')
@Controller('employee-documents')
export class EmployeeDocumentsController {
  constructor(private readonly empDocService: EmployeeDocumentsService) {}

  @Post()
  @ApiOperation({ summary: 'Upload/Create Employee Document' })
  @ApiCreatedResponse({ description: 'Employee Document successfully created.' })
  async create(@Body() createDto: CreateEmployeeDocumentDto) {
    const data = await this.empDocService.create(createDto);
    return { success: true, data, message: 'Employee Document uploaded successfully' };
  }

  @Get()
  @ApiOperation({ summary: 'List and filter all Employee Documents' })
  @ApiOkResponse({ description: 'Employee Documents retrieved successfully.' })
  async findAll(@Query() query: any) {
    const result = await this.empDocService.findAll(query);
    return { success: true, ...result };
  }

  @Get(':id')
  @ApiOperation({ summary: 'View a single Employee Document by ID' })
  @ApiOkResponse({ description: 'Employee Document details retrieved successfully.' })
  async findOne(@Param('id') id: string) {
    const data = await this.empDocService.findOne(id);
    return { success: true, data };
  }

  @Put(':id')
  @ApiOperation({ summary: 'Edit/Update an existing Employee Document' })
  @ApiOkResponse({ description: 'Employee Document updated successfully.' })
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateEmployeeDocumentDto,
  ) {
    const data = await this.empDocService.update(id, updateDto);
    return { success: true, data, message: 'Employee Document updated successfully' };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Patch update Employee Document' })
  async patch(
    @Param('id') id: string,
    @Body() updateDto: UpdateEmployeeDocumentDto,
  ) {
    const data = await this.empDocService.update(id, updateDto);
    return { success: true, data, message: 'Employee Document updated successfully' };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an Employee Document' })
  @ApiOkResponse({ description: 'Employee Document deleted successfully.' })
  async remove(@Param('id') id: string) {
    await this.empDocService.remove(id);
    return { success: true, message: 'Employee Document deleted successfully' };
  }
}
