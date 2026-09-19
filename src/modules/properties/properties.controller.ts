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
import { PropertiesService } from './properties.service';
import { CreatePropertyDto } from './dto/create-property.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';
import { QueryPropertyDto, GroupDeletePropertiesDto } from './dto/query-property.dto';
import { PropertyResponseDto } from './dto/property-response.dto';
import { ResponseMessage } from '../../common/decorators/response-message.decorator';

@ApiTags('Properties')
@Controller('properties')
export class PropertiesController {
  constructor(private readonly propertiesService: PropertiesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new Real-Estate Property' })
  @ApiCreatedResponse({
    description: 'Property listing successfully created.',
    type: PropertyResponseDto,
  })
  @ResponseMessage('Property created successfully')
  async create(@Body() createPropertyDto: CreatePropertyDto) {
    return this.propertiesService.create(createPropertyDto);
  }

  @Get('my-properties')
  @ApiOperation({
    summary: 'Get My Properties',
    description:
      'Returns properties assigned to or registered by the logged-in user, with optional filters and pagination.',
  })
  @ApiOkResponse({
    description: 'My Properties retrieved successfully.',
    type: [PropertyResponseDto],
  })
  @ResponseMessage('My Properties retrieved successfully')
  async getMyProperties(@Query() queryPropertyDto: QueryPropertyDto) {
    return this.propertiesService.getMyProperties(queryPropertyDto);
  }

  @Get('available-properties')
  @ApiOperation({
    summary: 'Get Available Properties',
    description:
      'Returns only properties with an active "Available" status stage, incorporating identical sorting, filters, and pagination.',
  })
  @ApiOkResponse({
    description: 'Available Properties retrieved successfully.',
    type: [PropertyResponseDto],
  })
  @ResponseMessage('Available Properties retrieved successfully')
  async getAvailableProperties(@Query() queryPropertyDto: QueryPropertyDto) {
    return this.propertiesService.getAvailableProperties(queryPropertyDto);
  }

  @Get()
  @ApiOperation({ summary: 'List and filter Real-Estate Properties' })
  @ApiOkResponse({
    description: 'Properties matching filters retrieved successfully.',
    type: [PropertyResponseDto],
  })
  @ResponseMessage('Properties retrieved successfully')
  async findAll(@Query() queryPropertyDto: QueryPropertyDto) {
    return this.propertiesService.findAll(queryPropertyDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Find a single Property by database ID' })
  @ApiOkResponse({
    description: 'Property found.',
    type: PropertyResponseDto,
  })
  @ResponseMessage('Property details retrieved successfully')
  async findOne(@Param('id') id: string) {
    return this.propertiesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Modify an existing Property listing' })
  @ApiOkResponse({
    description: 'Property modified successfully.',
    type: PropertyResponseDto,
  })
  @ResponseMessage('Property updated successfully')
  async update(
    @Param('id') id: string,
    @Body() updatePropertyDto: UpdatePropertyDto,
  ) {
    return this.propertiesService.update(id, updatePropertyDto);
  }

  @Get('actions/download')
  @ApiOperation({ summary: 'Export and download CRM Properties in Excel format' })
  async downloadExcel(@Query() query: QueryPropertyDto, @Res() reply: any) {
    const buffer = await this.propertiesService.downloadExcel(query);
    reply.header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    reply.header('Content-Disposition', 'attachment; filename="properties.xlsx"');
    reply.send(buffer);
  }

  @Post('actions/google-drive')
  @ApiOperation({ summary: 'Export and upload CRM Properties to Google Drive' })
  @ResponseMessage('Properties exported to Google Drive successfully')
  async uploadToGoogleDrive(
    @Body() body: { limit?: number; filters?: any },
  ) {
    return this.propertiesService.uploadToGoogleDrive(body.filters, body.limit);
  }

  @Post('actions/import')
  @ApiOperation({ summary: 'Import properties in bulk from spreadsheet data' })
  @ResponseMessage('Properties imported successfully')
  async importProperties(@Body() properties: any[]) {
    return this.propertiesService.importProperties(properties);
  }

  @Post('actions/group-delete')
  @ApiOperation({ summary: 'Bulk delete properties matching selection or filters' })
  @ResponseMessage('Properties bulk deleted successfully')
  async groupDelete(@Body() groupDeleteDto: GroupDeletePropertiesDto) {
    return this.propertiesService.groupDelete(groupDeleteDto);
  }

  @Post('upload-photos')
  @ApiOperation({ summary: 'Upload multiple property photos / images (Base64 data URIs)' })
  @ResponseMessage('Photos uploaded successfully')
  async uploadPhotos(
    @Body() body: { photos?: string[]; images?: string[] },
  ) {
    const input = body.photos || body.images || [];
    const urls = await this.propertiesService.processImages(input);
    return { urls };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a Property listing' })
  @ApiOkResponse({
    description: 'Property deleted.',
  })
  @ResponseMessage('Property deleted successfully')
  async remove(@Param('id') id: string) {
    await this.propertiesService.remove(id);
    return null;
  }
}
