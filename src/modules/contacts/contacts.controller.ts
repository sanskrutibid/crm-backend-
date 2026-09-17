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
  Req,
} from '@nestjs/common';
import {
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
  GroupTransferDto,
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
import { ResponseMessage } from '../../common/decorators/response-message.decorator';
import { SendEmailOtpDto, VerifyEmailOtpDto } from './dto/email-verification.dto';

@ApiTags('Contacts')
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
    const ip = req.ip || req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '127.0.0.1';
    return this.contactsService.create(createContactDto, undefined, ip);
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
  async createAudience(@Body() createAudienceDto: CreateAudienceDto) {
    return this.contactsService.createAudience(createAudienceDto);
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
  async sendGroupSms(@Body() sendSmsDto: SendSmsDto) {
    return this.contactsService.sendGroupSms(sendSmsDto);
  }

  @Post('actions/send-email')
  @ApiOperation({ summary: 'Send group Email to selected/all contacts' })
  @ResponseMessage('Group email sent successfully')
  async sendGroupEmail(@Body() sendEmailDto: SendEmailDto) {
    return this.contactsService.sendGroupEmail(sendEmailDto);
  }

  @Post('actions/group-delete')
  @ApiOperation({
    summary: 'Bulk delete contacts matching selection or filters',
  })
  @ResponseMessage('Contacts bulk deleted successfully')
  async groupDelete(@Body() groupDeleteDto: GroupDeleteDto) {
    return this.contactsService.groupDelete(groupDeleteDto);
  }

  @Post('actions/group-transfer')
  @ApiOperation({
    summary: 'Bulk transfer contacts ownership, folders, permissions',
  })
  @ResponseMessage('Contacts transferred successfully')
  async groupTransfer(@Body() groupTransferDto: GroupTransferDto) {
    return this.contactsService.groupTransfer(groupTransferDto);
  }

  @Get('actions/download')
  @ApiOperation({ summary: 'Export and download CRM Contacts in Excel format' })
  async downloadExcel(@Query() query: QueryContactDto, @Res() reply: any) {
    const buffer = await this.contactsService.downloadExcel(query);
    reply.header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    reply.header('Content-Disposition', 'attachment; filename="contacts.xlsx"');
    reply.send(buffer);
  }

  @Post('actions/google-drive')
  @ApiOperation({ summary: 'Export and upload CRM Contacts to Google Drive' })
  @ResponseMessage('Contacts exported to Google Drive successfully')
  async uploadToGoogleDrive(
    @Body() body: { limit?: number; filters?: any },
  ) {
    return this.contactsService.uploadToGoogleDrive(body.filters, body.limit);
  }

  @Post('actions/import')
  @ApiOperation({ summary: 'Import contacts in bulk from spreadsheet data' })
  @ResponseMessage('Contacts imported successfully')
  async importContacts(@Body() contacts: any[]) {
    return this.contactsService.importContacts(contacts);
  }

  @Post('actions/mark-dnd')
  @ApiOperation({ summary: 'Bulk update DND status for selected/all contacts' })
  @ResponseMessage('DND status updated successfully')
  async markDnd(@Body() markDndDto: MarkDndDto) {
    return this.contactsService.markDnd(markDndDto);
  }

  @Post('actions/verify-emails')
  @ApiOperation({ summary: 'Smarter bulk email verification for contacts' })
  @ResponseMessage('Email verification completed successfully')
  async verifyEmails(@Body() verifyEmailsDto: VerifyEmailsDto) {
    return this.contactsService.verifyEmails(verifyEmailsDto);
  }

  @Post('actions/merge')
  @ApiOperation({
    summary: 'Merge duplicate contacts into primary contact profile',
  })
  @ResponseMessage('Contacts merged successfully')
  async mergeContacts(@Body() mergeContactsDto: MergeContactsDto) {
    return this.contactsService.mergeContacts(mergeContactsDto);
  }

  @Post('actions/mark-dnd-comma')
  @ApiOperation({
    summary: 'Update DND status using comma separated mobile numbers (Max 500)',
  })
  @ResponseMessage('DND numbers updated successfully')
  async markDndComma(@Body() updateDndCommaDto: UpdateDndCommaDto) {
    return this.contactsService.markDndComma(updateDndCommaDto);
  }

  @Post('actions/auto-merge')
  @ApiOperation({
    summary: 'Auto merge all duplicate contacts sharing same mobile numbers',
  })
  @ResponseMessage('Duplicate contacts auto merged successfully')
  async autoMergeDuplicates() {
    return this.contactsService.autoMergeDuplicates();
  }

  @Get('actions/duplicate-count')
  @ApiOperation({
    summary: 'Get total duplicate records count based on mobile number similarity',
  })
  @ResponseMessage('Duplicate contacts count retrieved successfully')
  async getDuplicateCount() {
    return this.contactsService.countDuplicates();
  }

  @Post('email-verification/send')
  @ApiOperation({
    summary: 'Send a 6-digit OTP to the email address for verification',
  })
  @ResponseMessage('OTP sent successfully')
  async sendEmailOtp(@Body() sendEmailOtpDto: SendEmailOtpDto) {
    return this.contactsService.sendEmailOtp(sendEmailOtpDto.email);
  }

  @Post('email-verification/verify')
  @ApiOperation({
    summary: 'Verify the 6-digit OTP sent to the email address',
  })
  @ResponseMessage('Email verified successfully')
  async verifyEmailOtp(@Body() verifyEmailOtpDto: VerifyEmailOtpDto) {
    return this.contactsService.verifyEmailOtp(verifyEmailOtpDto.email, verifyEmailOtpDto.otp);
  }

  @Post(':id/actions/change-status')
  @ApiOperation({
    summary: 'Change status of a single contact with status & remark details',
  })
  @ResponseMessage('Contact status updated successfully')
  async changeStatus(
    @Param('id') id: string,
    @Body() changeStatusDto: ChangeStatusDto,
  ) {
    return this.contactsService.changeStatus(id, changeStatusDto);
  }

  @Post(':id/actions/send-sms')
  @ApiOperation({
    summary: 'Send scheduled or immediate single SMS to a contact',
  })
  @ResponseMessage('SMS queued/sent successfully')
  async sendSmsSingle(
    @Param('id') id: string,
    @Body() sendSmsSingleDto: SendSmsSingleDto,
  ) {
    return this.contactsService.sendSmsSingle(id, sendSmsSingleDto);
  }

  @Post(':id/actions/send-email')
  @ApiOperation({
    summary: 'Send scheduled or immediate single Email to a contact',
  })
  @ResponseMessage('Email queued/sent successfully')
  async sendEmailSingle(
    @Param('id') id: string,
    @Body() sendEmailSingleDto: SendEmailSingleDto,
  ) {
    return this.contactsService.sendEmailSingle(id, sendEmailSingleDto);
  }

  @Post(':id/actions/quick-note')
  @ApiOperation({
    summary: 'Add a new Quick Note comment detail on contact profile timeline',
  })
  @ResponseMessage('Quick note added successfully')
  async addQuickNote(
    @Param('id') id: string,
    @Body() quickNoteDto: QuickNoteDto,
  ) {
    return this.contactsService.addQuickNote(id, quickNoteDto);
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
  ) {
    return this.contactsService.transferContact(id, transferContactDto);
  }

  @Get(':id/actions/history')
  @ApiOperation({
    summary: 'Retrieve activity history logs for a single contact profile',
  })
  @ResponseMessage('Contact activity history retrieved successfully')
  async getContactHistory(@Param('id') id: string) {
    return this.contactsService.getContactHistory(id);
  }

  @Get(':id/detailed-history')
  @ApiOperation({
    summary: 'Retrieve detailed creation, conversion, and activity history for a contact',
  })
  @ResponseMessage('Detailed contact history retrieved successfully')
  async getDetailedHistory(@Param('id') id: string) {
    return this.contactsService.getDetailedHistory(id);
  }

  @Post(':id/actions/attach-document')
  @ApiOperation({
    summary: 'Attach uploaded document metadata to a contact profile',
  })
  @ResponseMessage('Document attached successfully')
  async attachDocument(
    @Param('id') id: string,
    @Body() attachDocumentDto: AttachDocumentDto,
  ) {
    return this.contactsService.attachDocument(id, attachDocumentDto);
  }

  @Post(':id/actions/terms-conditions')
  @ApiOperation({
    summary: 'Email rich text Terms and Conditions to a contact',
  })
  @ResponseMessage('Terms and Conditions sent successfully')
  async sendTermsConditions(
    @Param('id') id: string,
    @Body() termsConditionsDto: TermsConditionsDto,
  ) {
    return this.contactsService.sendTermsConditions(id, termsConditionsDto);
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
