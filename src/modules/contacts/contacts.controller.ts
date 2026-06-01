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
  Header,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiCreatedResponse,
  ApiOkResponse,
} from '@nestjs/swagger';
import { ContactsService } from './contacts.service';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';
import { QueryContactDto } from './dto/query-contact.dto';
import { ContactResponseDto } from './dto/contact-response.dto';
import {
  CreateAudienceDto,
  SendSmsDto,
  SendEmailDto,
  GroupDeleteDto,
  MarkDndDto,
  VerifyEmailsDto,
  MergeContactsDto,
  UpdateDndCommaDto,
} from './dto/bulk-actions.dto';
import {
  ChangeStatusDto,
  SendSmsSingleDto,
  SendEmailSingleDto,
  QuickNoteDto,
  TransferContactDto,
  AttachDocumentDto,
  TermsConditionsDto,
} from './dto/single-actions.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ResponseMessage } from '../../common/decorators/response-message.decorator';

@ApiTags('Contacts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('contacts')
export class ContactsController {
  constructor(private readonly contactsService: ContactsService) {}

  @Post()
  @ApiOperation({
    summary:
      'Create a new CRM Contact (Personal + Professional + Save/Publish)',
  })
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
  @ApiOperation({
    summary:
      'List and filter all Contacts with search, sorting, and pagination',
  })
  @ApiOkResponse({
    description: 'Contacts matching filters retrieved successfully.',
    type: [ContactResponseDto],
  })
  @ResponseMessage('Contacts retrieved successfully')
  async findAll(@Query() queryContactDto: QueryContactDto) {
    return this.contactsService.findAll(queryContactDto);
  }

  @Post('actions/create-audience')
  @ApiOperation({
    summary: 'Create a new marketing Audience from selected/all contacts',
  })
  @ResponseMessage('Audience created successfully')
  async createAudience(
    @Body() createAudienceDto: CreateAudienceDto,
    @Req() req: any,
  ) {
    const requestUserId = req.user.id;
    return this.contactsService.createAudience(
      createAudienceDto,
      requestUserId,
    );
  }

  @Get('actions/audiences')
  @ApiOperation({ summary: 'Retrieve all saved marketing Audiences' })
  @ResponseMessage('Audiences retrieved successfully')
  async getAudiences() {
    return this.contactsService.getAudiences();
  }

  @Post('actions/send-sms')
  @ApiOperation({ summary: 'Send group SMS to selected/all contacts' })
  @ResponseMessage('Group SMS sent successfully')
  async sendGroupSms(@Body() sendSmsDto: SendSmsDto, @Req() req: any) {
    const requestUserId = req.user.id;
    return this.contactsService.sendGroupSms(sendSmsDto, requestUserId);
  }

  @Post('actions/send-email')
  @ApiOperation({ summary: 'Send group Email to selected/all contacts' })
  @ResponseMessage('Group email sent successfully')
  async sendGroupEmail(@Body() sendEmailDto: SendEmailDto, @Req() req: any) {
    const requestUserId = req.user.id;
    return this.contactsService.sendGroupEmail(sendEmailDto, requestUserId);
  }

  @Post('actions/group-delete')
  @ApiOperation({
    summary: 'Bulk delete contacts matching selection or filters',
  })
  @ResponseMessage('Contacts bulk deleted successfully')
  async groupDelete(@Body() groupDeleteDto: GroupDeleteDto, @Req() req: any) {
    const requestUserId = req.user.id;
    return this.contactsService.groupDelete(groupDeleteDto, requestUserId);
  }

  @Get('actions/download')
  @Header('Content-Type', 'text/csv')
  @Header('Content-Disposition', 'attachment; filename="contacts.csv"')
  @ApiOperation({ summary: 'Export and download CRM Contacts in CSV format' })
  async downloadExcel(@Query() query: QueryContactDto) {
    return this.contactsService.downloadExcel(query);
  }

  @Post('actions/import')
  @ApiOperation({ summary: 'Import contacts in bulk from spreadsheet data' })
  @ResponseMessage('Contacts imported successfully')
  async importContacts(@Body() contacts: any[], @Req() req: any) {
    const requestUserId = req.user.id;
    return this.contactsService.importContacts(contacts, requestUserId);
  }

  @Post('actions/mark-dnd')
  @ApiOperation({ summary: 'Bulk update DND status for selected/all contacts' })
  @ResponseMessage('DND status updated successfully')
  async markDnd(@Body() markDndDto: MarkDndDto, @Req() req: any) {
    const requestUserId = req.user.id;
    return this.contactsService.markDnd(markDndDto, requestUserId);
  }

  @Post('actions/verify-emails')
  @ApiOperation({ summary: 'Smarter bulk email verification for contacts' })
  @ResponseMessage('Email verification completed successfully')
  async verifyEmails(
    @Body() verifyEmailsDto: VerifyEmailsDto,
    @Req() req: any,
  ) {
    const requestUserId = req.user.id;
    return this.contactsService.verifyEmails(verifyEmailsDto, requestUserId);
  }

  @Post('actions/merge')
  @ApiOperation({
    summary: 'Merge duplicate contacts into primary contact profile',
  })
  @ResponseMessage('Contacts merged successfully')
  async mergeContacts(
    @Body() mergeContactsDto: MergeContactsDto,
    @Req() req: any,
  ) {
    const requestUserId = req.user.id;
    return this.contactsService.mergeContacts(mergeContactsDto, requestUserId);
  }

  @Post('actions/mark-dnd-comma')
  @ApiOperation({
    summary: 'Update DND status using comma separated mobile numbers (Max 500)',
  })
  @ResponseMessage('DND numbers updated successfully')
  async markDndComma(
    @Body() updateDndCommaDto: UpdateDndCommaDto,
    @Req() req: any,
  ) {
    const requestUserId = req.user.id;
    return this.contactsService.markDndComma(updateDndCommaDto, requestUserId);
  }

  @Post('actions/auto-merge')
  @ApiOperation({
    summary: 'Auto merge all duplicate contacts sharing same mobile numbers',
  })
  @ResponseMessage('Duplicate contacts auto merged successfully')
  async autoMergeDuplicates(@Req() req: any) {
    const requestUserId = req.user.id;
    return this.contactsService.autoMergeDuplicates(requestUserId);
  }

  @Post(':id/actions/change-status')
  @ApiOperation({
    summary: 'Change status of a single contact with status & remark details',
  })
  @ResponseMessage('Contact status updated successfully')
  async changeStatus(
    @Param('id') id: string,
    @Body() changeStatusDto: ChangeStatusDto,
    @Req() req: any,
  ) {
    const requestUserId = req.user.id;
    return this.contactsService.changeStatus(
      id,
      changeStatusDto,
      requestUserId,
    );
  }

  @Post(':id/actions/send-sms')
  @ApiOperation({
    summary: 'Send scheduled or immediate single SMS to a contact',
  })
  @ResponseMessage('SMS queued/sent successfully')
  async sendSmsSingle(
    @Param('id') id: string,
    @Body() sendSmsSingleDto: SendSmsSingleDto,
    @Req() req: any,
  ) {
    const requestUserId = req.user.id;
    return this.contactsService.sendSmsSingle(
      id,
      sendSmsSingleDto,
      requestUserId,
    );
  }

  @Post(':id/actions/send-email')
  @ApiOperation({
    summary: 'Send scheduled or immediate single Email to a contact',
  })
  @ResponseMessage('Email queued/sent successfully')
  async sendEmailSingle(
    @Param('id') id: string,
    @Body() sendEmailSingleDto: SendEmailSingleDto,
    @Req() req: any,
  ) {
    const requestUserId = req.user.id;
    return this.contactsService.sendEmailSingle(
      id,
      sendEmailSingleDto,
      requestUserId,
    );
  }

  @Post(':id/actions/quick-note')
  @ApiOperation({
    summary: 'Add a new Quick Note comment detail on contact profile timeline',
  })
  @ResponseMessage('Quick note added successfully')
  async addQuickNote(
    @Param('id') id: string,
    @Body() quickNoteDto: QuickNoteDto,
    @Req() req: any,
  ) {
    const requestUserId = req.user.id;
    return this.contactsService.addQuickNote(id, quickNoteDto, requestUserId);
  }

  @Post(':id/actions/transfer')
  @ApiOperation({
    summary:
      'Transfer ownership assignment of a single contact to another agent',
  })
  @ResponseMessage('Contact transferred successfully')
  async transferContact(
    @Param('id') id: string,
    @Body() transferContactDto: TransferContactDto,
    @Req() req: any,
  ) {
    const requestUserId = req.user.id;
    return this.contactsService.transferContact(
      id,
      transferContactDto,
      requestUserId,
    );
  }

  @Get(':id/actions/history')
  @ApiOperation({
    summary: 'Retrieve activity history logs for a single contact profile',
  })
  @ResponseMessage('Contact activity history retrieved successfully')
  async getContactHistory(@Param('id') id: string) {
    return this.contactsService.getContactHistory(id);
  }

  @Post(':id/actions/attach-document')
  @ApiOperation({
    summary: 'Attach uploaded document metadata to a contact profile',
  })
  @ResponseMessage('Document attached successfully')
  async attachDocument(
    @Param('id') id: string,
    @Body() attachDocumentDto: AttachDocumentDto,
    @Req() req: any,
  ) {
    const requestUserId = req.user.id;
    return this.contactsService.attachDocument(
      id,
      attachDocumentDto,
      requestUserId,
    );
  }

  @Post(':id/actions/terms-conditions')
  @ApiOperation({
    summary: 'Email rich text Terms and Conditions to a contact',
  })
  @ResponseMessage('Terms and Conditions sent successfully')
  async sendTermsConditions(
    @Param('id') id: string,
    @Body() termsConditionsDto: TermsConditionsDto,
    @Req() req: any,
  ) {
    const requestUserId = req.user.id;
    return this.contactsService.sendTermsConditions(
      id,
      termsConditionsDto,
      requestUserId,
    );
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
