import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiCreatedResponse, ApiOkResponse } from '@nestjs/swagger';
import { ContactsService } from './contacts.service';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';
import { QueryContactDto } from './dto/query-contact.dto';
import { ContactResponseDto } from './dto/contact-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ResponseMessage } from '../../common/decorators/response-message.decorator';

@ApiTags('Contacts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('contacts')
export class ContactsController {
  constructor(private readonly contactsService: ContactsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new CRM Contact (Personal + Professional + Save/Publish)' })
  @ApiCreatedResponse({
    description: 'Contact record successfully created.',
    type: ContactResponseDto,
  })
  @ResponseMessage('Contact created successfully')
  async create(@Body() createContactDto: CreateContactDto, @Req() req: any) {
    const requestUserId = req.user.id;
    return this.contactsService.create(createContactDto, requestUserId);
  }

  @Get()
  @ApiOperation({ summary: 'List and filter all Contacts with search, sorting, and pagination' })
  @ApiOkResponse({
    description: 'Contacts matching filters retrieved successfully.',
    type: [ContactResponseDto],
  })
  @ResponseMessage('Contacts retrieved successfully')
  async findAll(@Query() queryContactDto: QueryContactDto) {
    return this.contactsService.findAll(queryContactDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Find detailed Profile of a Contact by ID' })
  @ApiOkResponse({
    description: 'Contact profile details found.',
    type: ContactResponseDto,
  })
  @ResponseMessage('Contact details retrieved successfully')
  async findOne(@Param('id') id: string) {
    return this.contactsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Modify an existing Contact profile record' })
  @ApiOkResponse({
    description: 'Contact modified successfully.',
    type: ContactResponseDto,
  })
  @ResponseMessage('Contact updated successfully')
  async update(
    @Param('id') id: string,
    @Body() updateContactDto: UpdateContactDto,
  ) {
    return this.contactsService.update(id, updateContactDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a Contact profile from CRM database' })
  @ApiOkResponse({
    description: 'Contact deleted.',
  })
  @ResponseMessage('Contact deleted successfully')
  async remove(@Param('id') id: string) {
    await this.contactsService.remove(id);
    return null;
  }
}
