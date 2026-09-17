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
import { SaleAgreementsService } from './sale-agreements.service';
import { CreateSaleAgreementDto } from './dto/create-sale-agreement.dto';
import { UpdateSaleAgreementDto } from './dto/update-sale-agreement.dto';
import { QuerySaleAgreementDto } from './dto/query-sale-agreement.dto';
import { SaleAgreementResponseDto } from './dto/sale-agreement-response.dto';
import { ResponseMessage } from '../../common/decorators/response-message.decorator';

@ApiTags('Sale Agreements')
@Controller('sale-agreements')
export class SaleAgreementsController {
  constructor(private readonly saleAgreementsService: SaleAgreementsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new Sale Agreement' })
  @ApiCreatedResponse({
    description: 'Sale Agreement successfully created.',
    type: SaleAgreementResponseDto,
  })
  @ResponseMessage('Sale Agreement created successfully')
  async create(@Body() createDto: CreateSaleAgreementDto) {
    // Falls back to createdBy in the DTO if provided
    return this.saleAgreementsService.create(createDto, createDto.assignedTo);
  }

  @Get()
  @ApiOperation({ summary: 'List and filter Sale Agreements' })
  @ApiOkResponse({
    description: 'Sale Agreements retrieved successfully.',
    type: [SaleAgreementResponseDto],
  })
  @ResponseMessage('Sale Agreements retrieved successfully')
  async findAll(@Query() queryDto: QuerySaleAgreementDto) {
    return this.saleAgreementsService.findAll(queryDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Find a single Sale Agreement by database ID' })
  @ApiOkResponse({
    description: 'Sale Agreement found.',
    type: SaleAgreementResponseDto,
  })
  @ResponseMessage('Sale Agreement details retrieved successfully')
  async findOne(@Param('id') id: string) {
    return this.saleAgreementsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Modify an existing Sale Agreement' })
  @ApiOkResponse({
    description: 'Sale Agreement updated successfully.',
    type: SaleAgreementResponseDto,
  })
  @ResponseMessage('Sale Agreement updated successfully')
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateSaleAgreementDto,
  ) {
    return this.saleAgreementsService.update(id, updateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a Sale Agreement' })
  @ApiOkResponse({
    description: 'Sale Agreement deleted successfully.',
  })
  @ResponseMessage('Sale Agreement deleted successfully')
  async remove(@Param('id') id: string) {
    await this.saleAgreementsService.remove(id);
    return null;
  }
}
