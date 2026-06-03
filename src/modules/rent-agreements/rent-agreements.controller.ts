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
import { RentAgreementsService } from './rent-agreements.service';
import { CreateRentAgreementDto } from './dto/create-rent-agreement.dto';
import { UpdateRentAgreementDto } from './dto/update-rent-agreement.dto';
import { QueryRentAgreementDto } from './dto/query-rent-agreement.dto';
import { RentAgreementResponseDto } from './dto/rent-agreement-response.dto';
import { ResponseMessage } from '../../common/decorators/response-message.decorator';

@ApiTags('Rent Agreements')
@Controller('rent-agreements')
export class RentAgreementsController {
  constructor(private readonly rentAgreementsService: RentAgreementsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new Rent Agreement' })
  @ApiCreatedResponse({
    description: 'Rent Agreement successfully created.',
    type: RentAgreementResponseDto,
  })
  @ResponseMessage('Rent Agreement created successfully')
  async create(@Body() createDto: CreateRentAgreementDto) {
    return this.rentAgreementsService.create(createDto, createDto.assignedTo);
  }

  @Get()
  @ApiOperation({ summary: 'List and filter Rent Agreements' })
  @ApiOkResponse({
    description: 'Rent Agreements retrieved successfully.',
    type: [RentAgreementResponseDto],
  })
  @ResponseMessage('Rent Agreements retrieved successfully')
  async findAll(@Query() queryDto: QueryRentAgreementDto) {
    return this.rentAgreementsService.findAll(queryDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Find a single Rent Agreement by database ID' })
  @ApiOkResponse({
    description: 'Rent Agreement found.',
    type: RentAgreementResponseDto,
  })
  @ResponseMessage('Rent Agreement details retrieved successfully')
  async findOne(@Param('id') id: string) {
    return this.rentAgreementsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Modify an existing Rent Agreement' })
  @ApiOkResponse({
    description: 'Rent Agreement updated successfully.',
    type: RentAgreementResponseDto,
  })
  @ResponseMessage('Rent Agreement updated successfully')
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateRentAgreementDto,
  ) {
    return this.rentAgreementsService.update(id, updateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a Rent Agreement' })
  @ApiOkResponse({
    description: 'Rent Agreement deleted successfully.',
  })
  @ResponseMessage('Rent Agreement deleted successfully')
  async remove(@Param('id') id: string) {
    await this.rentAgreementsService.remove(id);
    return null;
  }
}
