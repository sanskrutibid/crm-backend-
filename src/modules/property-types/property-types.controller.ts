import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PropertyTypesService } from './property-types.service';
import { CreatePropertyTypeDto } from './dto/create-property-type.dto';
import { UpdatePropertyTypeDto } from './dto/update-property-type.dto';
import { ResponseMessage } from '../../common/decorators/response-message.decorator';

@ApiTags('Property Types')
@Controller('property-types')
export class PropertyTypesController {
  constructor(private readonly propertyTypesService: PropertyTypesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new property type' })
  @ResponseMessage('Property type created successfully')
  async create(@Body() createPropertyTypeDto: CreatePropertyTypeDto) {
    return this.propertyTypesService.create(createPropertyTypeDto);
  }

  @Get()
  @ApiOperation({ summary: 'Retrieve all property types' })
  @ResponseMessage('Property types retrieved successfully')
  async findAll() {
    return this.propertyTypesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single property type detail' })
  @ResponseMessage('Property type retrieved successfully')
  async findOne(@Param('id') id: string) {
    return this.propertyTypesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update property type details' })
  @ResponseMessage('Property type updated successfully')
  async update(
    @Param('id') id: string,
    @Body() updatePropertyTypeDto: UpdatePropertyTypeDto,
  ) {
    return this.propertyTypesService.update(id, updatePropertyTypeDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a property type' })
  @ResponseMessage('Property type deleted successfully')
  async remove(@Param('id') id: string) {
    await this.propertyTypesService.remove(id);
    return { success: true };
  }
}
