import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiCreatedResponse, ApiOkResponse } from '@nestjs/swagger';
import { PropertiesService } from './properties.service';
import { CreatePropertyDto } from './dto/create-property.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';
import { QueryPropertyDto } from './dto/query-property.dto';
import { PropertyResponseDto } from './dto/property-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ResponseMessage } from '../../common/decorators/response-message.decorator';

@ApiTags('Properties')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
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
