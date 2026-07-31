import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Header,
  Res,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiCreatedResponse,
  ApiOkResponse,
} from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { CreateReportDto } from './dto/create-report.dto';
import { UpdateReportDto } from './dto/update-report.dto';
import { QueryReportDto } from './dto/query-report.dto';
import { ReportResponseDto } from './dto/report-response.dto';
import { ResponseMessage } from '../../common/decorators/response-message.decorator';

@ApiTags('Reports')
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new Report config' })
  @ApiCreatedResponse({
    description: 'Report configuration successfully created.',
    type: ReportResponseDto,
  })
  @ResponseMessage('Report created successfully')
  async create(@Body() createDto: CreateReportDto) {
    return this.reportsService.create(createDto);
  }

  @Get()
  @ApiOperation({ summary: 'List and filter Report configurations' })
  @ApiOkResponse({
    description: 'Reports retrieved successfully.',
    type: [ReportResponseDto],
  })
  @ResponseMessage('Reports retrieved successfully')
  async findAll(@Query() queryDto: QueryReportDto) {
    return this.reportsService.findAll(queryDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Find a single Report by database ID' })
  @ApiOkResponse({
    description: 'Report found.',
    type: ReportResponseDto,
  })
  @ResponseMessage('Report details retrieved successfully')
  async findOne(@Param('id') id: string) {
    return this.reportsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Modify an existing Report config' })
  @ApiOkResponse({
    description: 'Report configuration updated successfully.',
    type: ReportResponseDto,
  })
  @ResponseMessage('Report updated successfully')
  async update(@Param('id') id: string, @Body() updateDto: UpdateReportDto) {
    return this.reportsService.update(id, updateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a Report config' })
  @ApiOkResponse({
    description: 'Report configuration deleted successfully.',
  })
  @ResponseMessage('Report deleted successfully')
  async remove(@Param('id') id: string) {
    await this.reportsService.remove(id);
    return null;
  }

  @Get(':id/data')
  @ApiOperation({ summary: 'Get Report headers and rows data' })
  @ResponseMessage('Report data retrieved successfully')
  async getReportData(@Param('id') id: string) {
    return this.reportsService.getReportData(id);
  }

  @Get(':id/download')
  @ApiOperation({ summary: 'Export and download Report in Excel format' })
  async downloadReport(@Param('id') id: string, @Res() reply: any) {
    const { buffer, fileName } = await this.reportsService.generateReportExcel(id);
    reply.header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    reply.header('Content-Disposition', `attachment; filename="${fileName}"`);
    reply.send(buffer);
  }

  @Post(':id/google-drive')
  @ApiOperation({ summary: 'Export and upload Report to Google Drive' })
  @ResponseMessage('Report uploaded to Google Drive successfully')
  async uploadToGoogleDrive(@Param('id') id: string) {
    const { buffer, fileName } = await this.reportsService.generateReportExcel(id);
    return this.reportsService.uploadExcelToGoogleDrive(buffer, fileName);
  }
}
