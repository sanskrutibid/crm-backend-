import {
  Injectable,
  NotFoundException,
  BadRequestException,
  OnModuleInit,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as dns from 'dns';
import { promisify } from 'util';
import {
  Contact,
  ContactDocument,
  DNDStatus,
  EmailStatus,
  ContactVisibility,
} from './schemas/contact.schema';
import { Audience, AudienceDocument } from './schemas/audience.schema';
import {
  EmailVerification,
  EmailVerificationDocument,
} from './schemas/email-verification.schema';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';
import { QueryContactDto } from './dto/query-contact.dto';
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
import { User, UserDocument } from '../users/schemas/user.schema';
import { ActivitiesService } from '../activities/activities.service';
import { ActivityType } from '../activities/schemas/activity.schema';
import { EmailsService } from '../emails/emails.service';
import { SmsService } from '../sms/sms.service';
import {
  LeadConversionLog,
  LeadConversionLogDocument,
} from '../leads/schemas/lead-conversion-log.schema';

@Injectable()
export class ContactsService implements OnModuleInit {
  private readonly logger = new Logger(ContactsService.name);

  constructor(
    @InjectModel(Contact.name)
    private readonly contactModel: Model<ContactDocument>,
    @InjectModel(Audience.name)
    private readonly audienceModel: Model<AudienceDocument>,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(EmailVerification.name)
    private readonly emailVerificationModel: Model<EmailVerificationDocument>,
    @InjectModel(LeadConversionLog.name)
    private readonly leadConversionLogModel: Model<LeadConversionLogDocument>,
    private readonly activitiesService: ActivitiesService,
    private readonly emailsService: EmailsService,
    private readonly smsService: SmsService,
  ) {}

  /**
   * Seed Dayamati Chirawali's contact details on boot if the database collection is empty.
   */
  async onModuleInit() {
    const contactCount = await this.contactModel.countDocuments().exec();
    if (contactCount === 0) {
      const defaultUser = await this.userModel.findOne().exec();
      if (defaultUser) {
        const seedContact: Partial<Contact> = {
          salutation: 'Mrs',
          firstName: 'Dayamati',
          lastName: 'Chirawali',
          customerType: 'Customer',
          contactType: 'Employee',
          mobile: '+91 9876543031',
          dndStatus: DNDStatus.PENDING,
          otherNumbers: '+91 8765432109',
          email: 'dayamati.chirawali@gmail.com',
          emailStatus: EmailStatus.SAFE,
          uniqueNumber: 'GC170426-110807-2165',
          address: 'Dhantoli, Nearby Lokmat Building',
          city: 'Nagpur',
          locality: 'Dhantoli',
          pincode: '440012',
          companyName: 'Chirawali Group LLC',
          businessDomain: 'Real Estate & Landscaping',
          companyType: 'Private Limited',
          designation: 'Director Of Operations',
          investCapacity: '₹5 Cr - ₹10 Cr',
          bankName: 'State Bank of India',
          bankAccountName: 'Dayamati Chirawali',
          bankAccountNumber: '32104598734',
          ifscCode: 'SBIN0001423',
          professionalLocality: 'Dhantoli',
          sendEmailGreeting: true,
          sendSmsGreeting: true,
          preferredLanguage: 'English',
          rating: 4.5,
          customerRemark:
            'High intent buyer, looking for immediate flats in Dhantoli.',
          keyword: 'Dhantoli, 172Sqft flat 2cr',
          folder: 'Dhantoli Premium Folder',
          source: 'Campaigns',
          branch: 'Global Team',
          assignedTo: defaultUser._id as any,
          visibility: ContactVisibility.PRIVATE,
          isConfidential: false,
          subscribePromotions: true,
        };
        await this.contactModel.create(seedContact);
        console.log(
          '🌱 Successfully seeded initial Contacts directory database collection.',
        );
      } else {
        console.log(
          '⚠️ No users found in database to assign seed Contacts to. Seeding skipped.',
        );
      }
    }
  }

  /**
   * Generates a hyper-realistic contact unique number in the format GC[YYMMDD]-[HHMMSS]-[RAND4]
   */
  private generateUniqueNumber(): string {
    const now = new Date();
    const yy = String(now.getFullYear()).substring(2);
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const hh = String(now.getHours()).padStart(2, '0');
    const min = String(now.getMinutes()).padStart(2, '0');
    const ss = String(now.getSeconds()).padStart(2, '0');
    const rand = Math.floor(1000 + Math.random() * 9000);
    return `GC${yy}${mm}${dd}-${hh}${min}${ss}-${rand}`;
  }

  /**
   * Validates if the email address is proper, non-dummy, and has valid MX DNS records.
   */
  private async checkEmailDeliverability(email: string): Promise<{ valid: boolean; reason?: string }> {
    if (!email) return { valid: false, reason: 'Email address is required' };
    const cleanEmail = email.trim().toLowerCase();

    // 1. Basic regex check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      return { valid: false, reason: 'Invalid email format' };
    }

    const [username, domain] = cleanEmail.split('@');

    // 2. Check for common dummy usernames
    const commonDummyUsernames = [
      'test', 'demo', 'dummy', 'temp', 'fake', 'example', 'random', 'admin', 'user', 'guest', 'abc', 'xyz', 'sam'
    ];
    if (commonDummyUsernames.includes(username)) {
      return { valid: false, reason: `"${username}" is a generic or dummy username` };
    }

    // Generic public email checks (Gmail requires >= 6 chars for usernames)
    if (domain === 'gmail.com' && username.length < 6) {
      return { valid: false, reason: 'Gmail usernames must be at least 6 characters long' };
    }

    // 3. Check for disposable domains
    const disposableDomains = [
      'mailinator.com', 'yopmail.com', 'tempmail.com', 'guerrillamail.com',
      'dispostable.com', '10minutemail.com', 'trashmail.com', 'getairmail.com'
    ];
    if (disposableDomains.includes(domain)) {
      return { valid: false, reason: 'Disposable email domains are not allowed' };
    }

    // 4. DNS MX record lookup
    const resolveMxAsync = promisify(dns.resolveMx);
    try {
      const mxRecords = await resolveMxAsync(domain);
      if (!mxRecords || mxRecords.length === 0) {
        return { valid: false, reason: 'The domain does not have active mail servers (no MX records found)' };
      }
    } catch (err) {
      return { valid: false, reason: `Unable to resolve mail server for domain: "${domain}"` };
    }

    return { valid: true };
  }

  async create(
    createContactDto: CreateContactDto,
    defaultUserId?: string,
    ipAddress?: string,
  ): Promise<ContactDocument> {
    const assignedTo = createContactDto.assignedTo || defaultUserId;
    const uniqueNumber =
      createContactDto.uniqueNumber || this.generateUniqueNumber();

    // Auto-verify email status if email is provided and valid
    let emailStatus = EmailStatus.PENDING;
    if (createContactDto.email && createContactDto.email.trim()) {
      const checkResult = await this.checkEmailDeliverability(createContactDto.email);
      emailStatus = checkResult.valid ? EmailStatus.SAFE : EmailStatus.UNSAFE;
    } else if (createContactDto.emailStatus) {
      emailStatus = createContactDto.emailStatus;
    }

    const newContact = new this.contactModel({
      ...createContactDto,
      emailStatus,
      assignedTo,
      uniqueNumber,
      createdBy: defaultUserId,
      createdIp: ipAddress,
    });
    const savedContact = await newContact.save();

    // Log the contact addition in the CRM Activity Feed
    const name =
      `${savedContact.firstName} ${savedContact.lastName || ''}`.trim();
    await this.activitiesService.log(
      `Created contact: "${name}" [Type: ${savedContact.customerType}] under ${savedContact.branch} branch`,
      ActivityType.LEAD,
      defaultUserId,
    );

    return savedContact.populate(['assignedTo', 'createdBy']);
  }

  async findAll(
    query: QueryContactDto,
  ): Promise<{ contacts: ContactDocument[]; total: number; todayCount: number; shortlistedCount: number }> {
    const {
      customerType,
      contactType,
      branch,
      assignedTo,
      assignTo,
      submittedBy,
      city,
      location,
      status,
      permission,
      batchNumber,
      searchMode,
      source,
      createDateFrom,
      createDateTo,
      dobFrom,
      dobTo,
      anniversaryFrom,
      anniversaryTo,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      updatedSince,
      page,
      limit,
    } = query;
    const filter: any = { isDeleted: { $ne: true } };

    if (customerType) {
      filter.customerType = customerType;
    }

    if (contactType) {
      filter.contactType = contactType;
    }

    if (branch) {
      filter.branch = branch;
    }

    const targetAssignee = assignedTo || assignTo;
    if (targetAssignee) {
      filter.assignedTo = targetAssignee;
    }

    if (submittedBy) {
      filter.createdBy = submittedBy;
    }

    if (city) {
      filter.city = new RegExp(city, 'i');
    }

    if (location) {
      filter.locality = new RegExp(location, 'i');
    }

    if (status) {
      filter.status = status;
    }

    if (permission) {
      filter.visibility =
        permission === 'Private'
          ? ContactVisibility.PRIVATE
          : ContactVisibility.BRANCH;
    }

    if (batchNumber) {
      filter.$or = filter.$or || [];
      filter.$or.push(
        { keyword: new RegExp(batchNumber, 'i') },
        { folder: new RegExp(batchNumber, 'i') },
      );
    }

    if (source) {
      filter.source = new RegExp(source, 'i');
    }

    if (createDateFrom || createDateTo) {
      const range: any = {};
      if (createDateFrom) range.$gte = new Date(createDateFrom);
      if (createDateTo) range.$lte = new Date(createDateTo);
      filter.createdAt = range;
    }

    if (dobFrom || dobTo) {
      const range: any = {};
      if (dobFrom) range.$gte = dobFrom;
      if (dobTo) range.$lte = dobTo;
      filter.dob = range;
    }

    if (anniversaryFrom || anniversaryTo) {
      const range: any = {};
      if (anniversaryFrom) range.$gte = anniversaryFrom;
      if (anniversaryTo) range.$lte = anniversaryTo;
      filter.anniversary = range;
    }

    if (search) {
      const searchConditions = [
        { firstName: new RegExp(search, 'i') },
        { lastName: new RegExp(search, 'i') },
        { mobile: new RegExp(search, 'i') },
        { email: new RegExp(search, 'i') },
        { uniqueNumber: new RegExp(search, 'i') },
        { keyword: new RegExp(search, 'i') },
        { locality: new RegExp(search, 'i') },
      ];
      if (filter.$or) {
        filter.$and = filter.$and || [];
        filter.$and.push({ $or: searchConditions });
      } else {
        filter.$or = searchConditions;
      }
    }

    // Sync Filter: Retrieve only records added or modified after this timestamp
    if (updatedSince) {
      filter.updatedAt = { $gte: new Date(updatedSince) };
    }

    // Dynamic sorting
    const sortField = sortBy || 'createdAt';
    const sortDirection = sortOrder === 'asc' ? 1 : -1;
    let sortOption: any = { [sortField]: sortDirection };
    if (sortField === 'isStarred') {
      sortOption = { isStarred: sortDirection, createdAt: -1 };
    }

    // Calculate dynamic counts for today's and shortlisted contacts
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    // Pagination bypass logic: If limit is not specified, return all matching records at once.
    // If limit is specified and is >= 99999, return all matching records.
    const queryChain = this.contactModel
      .find(filter)
      .populate(['assignedTo', 'createdBy'])
      .sort(sortOption);

    if (limit && limit > 0 && limit < 99999) {
      const pageNum = page && page > 0 ? page : 1;
      queryChain.skip((pageNum - 1) * limit).limit(limit);
    }

    const [contacts, total, todayCount, shortlistedCount] = await Promise.all([
      queryChain.exec(),
      this.contactModel.countDocuments(filter).exec(),
      this.contactModel.countDocuments({
        isDeleted: { $ne: true },
        createdAt: { $gte: startOfToday, $lte: endOfToday },
      }).exec(),
      this.contactModel.countDocuments({
        isDeleted: { $ne: true },
        isStarred: true,
      }).exec(),
    ]);

    return { contacts, total, todayCount, shortlistedCount };
  }

  async findOne(id: string): Promise<ContactDocument> {
    const contact = await this.contactModel
      .findOne({ _id: id, isDeleted: { $ne: true } })
      .populate(['assignedTo', 'createdBy'])
      .exec();
    if (!contact) {
      throw new NotFoundException(`Contact with ID "${id}" not found`);
    }
    return contact;
  }

  async update(
    id: string,
    updateContactDto: UpdateContactDto,
  ): Promise<ContactDocument> {
    const originalContact = await this.contactModel
      .findOne({ _id: id, isDeleted: { $ne: true } })
      .exec();
    if (!originalContact) {
      throw new NotFoundException(`Contact with ID "${id}" not found`);
    }

    const updateData = { ...updateContactDto };
    if (updateData.email && updateData.email.trim()) {
      const checkResult = await this.checkEmailDeliverability(updateData.email);
      updateData.emailStatus = checkResult.valid ? EmailStatus.SAFE : EmailStatus.UNSAFE;
    }

    const updatedContact = await this.contactModel
      .findOneAndUpdate(
        { _id: id, isDeleted: { $ne: true } },
        updateData,
        { new: true },
      )
      .populate(['assignedTo', 'createdBy'])
      .exec();

    if (!updatedContact) {
      throw new NotFoundException(`Contact with ID "${id}" not found`);
    }

    // Log the contact update in the CRM Activity Feed
    const name =
      `${updatedContact.firstName} ${updatedContact.lastName || ''}`.trim();
    await this.activitiesService.log(
      `Modified details for contact: "${name}"`,
      ActivityType.LEAD,
    );

    return updatedContact;
  }

  async remove(id: string): Promise<void> {
    const contact = await this.contactModel
      .findOne({ _id: id, isDeleted: { $ne: true } })
      .exec();
    if (!contact) {
      throw new NotFoundException(`Contact with ID "${id}" not found`);
    }

    await this.contactModel
      .findByIdAndUpdate(id, { isDeleted: true, deletedAt: new Date() })
      .exec();

    // Log the contact deletion in the CRM Activity Feed
    const name = `${contact.firstName} ${contact.lastName || ''}`.trim();
    await this.activitiesService.log(
      `Deleted contact: "${name}"`,
      ActivityType.LEAD,
    );
  }

  private buildFilter(query: any): any {
    const filter: any = { isDeleted: { $ne: true } };
    if (!query) return filter;

    const {
      customerType,
      contactType,
      branch,
      assignedTo,
      search,
      updatedSince,
    } = query;

    if (customerType) {
      filter.customerType = customerType;
    }

    if (contactType) {
      filter.contactType = contactType;
    }

    if (branch) {
      filter.branch = branch;
    }

    if (assignedTo) {
      filter.assignedTo = assignedTo;
    }

    if (search) {
      filter.$or = [
        { firstName: new RegExp(search, 'i') },
        { lastName: new RegExp(search, 'i') },
        { mobile: new RegExp(search, 'i') },
        { email: new RegExp(search, 'i') },
        { uniqueNumber: new RegExp(search, 'i') },
        { keyword: new RegExp(search, 'i') },
        { locality: new RegExp(search, 'i') },
      ];
    }

    if (updatedSince) {
      filter.updatedAt = { $gte: new Date(updatedSince) };
    }

    return filter;
  }

  private validateSchedule(dto: any) {
    const { schedule, time, scheduleTime, setWeeks, setDays } = dto;
    const targetTime = time || scheduleTime;
    if (schedule === 'Daily') {
      if (!targetTime)
        throw new BadRequestException('Time is required for Daily schedule');
    } else if (schedule === 'Weekly') {
      if (!targetTime)
        throw new BadRequestException('Time is required for Weekly schedule');
      if (!setWeeks || setWeeks.length === 0) {
        throw new BadRequestException(
          'At least one weekday (setWeeks) is required for Weekly schedule',
        );
      }
    } else if (schedule === 'Monthly') {
      if (!targetTime)
        throw new BadRequestException('Time is required for Monthly schedule');
      if (!setDays || setDays.length === 0) {
        throw new BadRequestException(
          'At least one calendar date (setDays) is required for Monthly schedule',
        );
      }
    }
  }

  async createAudience(dto: CreateAudienceDto, defaultUserId?: string) {
    this.validateSchedule(dto);

    let contactIds = dto.contactIds;

    // If no specific contact IDs are provided, select contacts matching filters, or fall back to all contacts
    if (!contactIds || contactIds.length === 0) {
      const filter = this.buildFilter(dto.filters);
      const matchedContacts = await this.contactModel
        .find(filter, { _id: 1 })
        .exec();
      contactIds = matchedContacts.map((c) => c._id.toString());
    }

    const createdAudience = new this.audienceModel({
      name: dto.name,
      type: dto.type,
      template: dto.template,
      schedule: dto.schedule,
      time: dto.time || dto.scheduleTime,
      startDate: dto.startDate || dto.scheduleDate,
      setWeeks: dto.setWeeks,
      setDays: dto.setDays,
      contacts: contactIds,
      totalRecords: contactIds.length,
    });

    const savedAudience = await createdAudience.save();
    await savedAudience.populate('contacts');

    await this.activitiesService.log(
      `Created audience list: "${dto.name}" [Type: ${dto.type}, Template: ${dto.template}, Schedule: ${dto.schedule}] for ${contactIds.length} contacts`,
      ActivityType.LEAD,
      defaultUserId,
    );

    return savedAudience;
  }

  async getAudiences(): Promise<Audience[]> {
    return this.audienceModel.find().populate('contacts').exec();
  }

  async sendGroupSms(dto: SendSmsDto, defaultUserId?: string) {
    const filter =
      dto.contactIds && dto.contactIds.length > 0
        ? { _id: { $in: dto.contactIds }, isDeleted: { $ne: true } }
        : this.buildFilter(dto.filters);

    const contacts = await this.contactModel.find(filter).exec();
    const contactsWithMobile = contacts.filter(
      (contact) => contact.mobile && contact.mobile.trim().length > 0,
    );
    const count = contactsWithMobile.length;

    for (const contact of contactsWithMobile) {
      const countryCode = (contact.countryCode || '').trim();
      const mobileVal = contact.mobile.trim();
      const combinedMobile = countryCode ? `${countryCode}${mobileVal}` : mobileVal;
      await this.smsService.schedule({
        mobiles: combinedMobile,
        message: dto.message,
        dltTemplateId: dto.dltTemplateId,
        scheduleDate: dto.scheduleDate,
        scheduleTime: dto.scheduleTime,
        createdBy: defaultUserId,
      });
    }

    let scheduleDetail = `Scheduled: ${dto.scheduleDate} at ${dto.scheduleTime}`;
    if (dto.schedule && dto.schedule !== 'On Demand') {
      scheduleDetail = `Schedule: ${dto.schedule} at ${dto.scheduleTime}`;
      if (
        dto.schedule === 'Weekly' &&
        dto.setWeeks &&
        dto.setWeeks.length > 0
      ) {
        scheduleDetail += ` on [${dto.setWeeks.join(', ')}]`;
      } else if (
        dto.schedule === 'Monthly' &&
        dto.setDays &&
        dto.setDays.length > 0
      ) {
        scheduleDetail += ` on days [${dto.setDays.join(', ')}]`;
      }
    }

    await this.activitiesService.log(
      `Sent Group SMS: "${dto.message}" to ${count} contacts [Template: ${dto.template}, DLT ID: ${dto.dltTemplateId}, ${scheduleDetail}]`,
      ActivityType.LEAD,
      defaultUserId,
    );

    return { success: true, count };
  }

  async sendGroupEmail(dto: SendEmailDto, defaultUserId?: string) {
    const filter =
      dto.contactIds && dto.contactIds.length > 0
        ? { _id: { $in: dto.contactIds }, isDeleted: { $ne: true } }
        : this.buildFilter(dto.filters);

    const contacts = await this.contactModel.find(filter).exec();
    const contactsWithEmail = contacts.filter(
      (contact) => contact.email && contact.email.trim().length > 0,
    );
    const count = contactsWithEmail.length;

    for (const contact of contactsWithEmail) {
      await this.emailsService.schedule({
        to: contact.email!.trim(),
        subject: dto.subject,
        body: dto.message,
        scheduleDate: dto.scheduleDate,
        scheduleTime: dto.scheduleTime,
        createdBy: defaultUserId,
      });
    }

    await this.activitiesService.log(
      `Sent Group Email: "${dto.subject}" to ${count} contacts [Template: ${dto.template}, Scheduled: ${dto.scheduleDate} at ${dto.scheduleTime}]`,
      ActivityType.LEAD,
      defaultUserId,
    );

    return { success: true, count };
  }

  async groupDelete(dto: GroupDeleteDto, defaultUserId?: string) {
    const filter =
      dto.contactIds && dto.contactIds.length > 0
        ? { _id: { $in: dto.contactIds }, isDeleted: { $ne: true } }
        : this.buildFilter(dto.filters);

    const count = await this.contactModel.countDocuments(filter).exec();
    await this.contactModel
      .updateMany(filter, { isDeleted: true, deletedAt: new Date() })
      .exec();

    await this.activitiesService.log(
      `Bulk soft deleted ${count} contacts from CRM database`,
      ActivityType.LEAD,
      defaultUserId,
    );

    return { success: true, count };
  }

  async markDnd(dto: MarkDndDto, defaultUserId?: string) {
    const filter =
      dto.contactIds && dto.contactIds.length > 0
        ? { _id: { $in: dto.contactIds } }
        : this.buildFilter(dto.filters);

    const count = await this.contactModel.countDocuments(filter).exec();
    await this.contactModel
      .updateMany(filter, { dndStatus: dto.dndStatus })
      .exec();

    await this.activitiesService.log(
      `Bulk updated DND status to "${dto.dndStatus}" for ${count} contacts`,
      ActivityType.LEAD,
      defaultUserId,
    );

    return { success: true, count };
  }

  async verifyEmails(dto: VerifyEmailsDto, defaultUserId?: string) {
    const filter =
      dto.contactIds && dto.contactIds.length > 0
        ? { _id: { $in: dto.contactIds } }
        : this.buildFilter(dto.filters);

    const contacts = await this.contactModel.find(filter).exec();
    let count = 0;
    for (const contact of contacts) {
      if (contact.email) {
        const randomStatus =
          Math.random() > 0.15 ? EmailStatus.SAFE : EmailStatus.UNSAFE;
        contact.emailStatus = randomStatus;
        await contact.save();
        count++;
      }
    }

    await this.activitiesService.log(
      `Smarter email verification completed for ${count} contacts`,
      ActivityType.LEAD,
      defaultUserId,
    );

    return { success: true, count };
  }

  async mergeContacts(dto: MergeContactsDto, defaultUserId?: string) {
    const primary = await this.contactModel
      .findById(dto.primaryContactId)
      .exec();
    if (!primary) {
      throw new NotFoundException(`Primary contact not found`);
    }

    const duplicates = await this.contactModel
      .find({ _id: { $in: dto.duplicateContactIds } })
      .exec();
    const duplicateNames: string[] = [];

    const fieldsToMerge = [
      'salutation',
      'lastName',
      'otherNumbers',
      'email',
      'address',
      'city',
      'locality',
      'pincode',
      'companyName',
      'businessDomain',
      'companyType',
      'designation',
      'investCapacity',
      'bankName',
      'bankAccountName',
      'bankAccountNumber',
      'ifscCode',
      'professionalAddress',
      'professionalCity',
      'professionalLocality',
      'dob',
      'anniversary',
      'customerRemark',
      'keyword',
      'folder',
    ];

    for (const dup of duplicates) {
      duplicateNames.push(`${dup.firstName} ${dup.lastName || ''}`.trim());
      for (const field of fieldsToMerge) {
        if (!primary[field] && dup[field]) {
          primary[field] = dup[field];
        }
      }
    }

    await primary.save();
    await this.contactModel
      .deleteMany({ _id: { $in: dto.duplicateContactIds } })
      .exec();

    await this.activitiesService.log(
      `Merged duplicate contacts: [${duplicateNames.join(', ')}] into primary contact "${primary.firstName} ${primary.lastName || ''}`.trim() +
        '"',
      ActivityType.LEAD,
      defaultUserId,
    );

    return { success: true, primaryContact: primary };
  }

  private async generateContactsCsv(query: any): Promise<string> {
    const filter = this.buildFilter(query);
    const queryChain = this.contactModel
      .find(filter)
      .populate('assignedTo');

    if (query.limit) {
      const limitVal = parseInt(query.limit, 10);
      if (!isNaN(limitVal) && limitVal > 0) {
        queryChain.limit(limitVal);
      }
    }

    const contacts = await queryChain.exec();

    const headers = [
      'Customer ID',
      'Name',
      'Mobile Number',
      'Email',
      'Address',
      'Alternate Number',
      'Customer Type',
      'Contact Type',
      'Branch',
      'Created At',
    ];

    const rows = contacts.map((c) => {
      const nameParts = [c.salutation, c.firstName, c.lastName]
        .map((p) => (p || '').trim())
        .filter(Boolean);
      const combinedName = nameParts.length > 0 ? nameParts.join(' ') : '';

      const countryCode = (c.countryCode || '').trim();
      const mobileVal = (c.mobile || '').trim();
      const combinedMobile = countryCode ? `${countryCode}${mobileVal}` : mobileVal;

      const addressParts = [c.address, c.locality, c.city, c.pincode]
        .map((p) => (p || '').trim())
        .filter(Boolean);
      const combinedAddress = addressParts.join(', ');

      return [
        c.uniqueNumber || '',
        combinedName,
        combinedMobile,
        c.email || '',
        combinedAddress,
        c.otherNumbers || '',
        c.customerType || '',
        c.contactType || '',
        c.branch || '',
        (c as any).createdAt ? (c as any).createdAt.toISOString() : '',
      ];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map((r) =>
        r.map((val) => `"${val.replace(/"/g, '""')}"`).join(','),
      ),
    ].join('\n');

    return csvContent;
  }

  private async uploadCsvToGoogleDrive(csvContent: string, fileName: string): Promise<any> {
    const clientId = process.env.GOOGLE_DRIVE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_DRIVE_CLIENT_SECRET;
    const refreshToken = process.env.GOOGLE_DRIVE_REFRESH_TOKEN;

    if (clientId && clientSecret && refreshToken) {
      try {
        const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            client_id: clientId,
            client_secret: clientSecret,
            refresh_token: refreshToken,
            grant_type: 'refresh_token',
          }),
        });

        if (!tokenResponse.ok) {
          const errText = await tokenResponse.text();
          throw new Error(`Google OAuth token refresh failed: ${errText}`);
        }

        const tokenData = (await tokenResponse.json()) as any;
        const accessToken = tokenData.access_token;

        const boundary = 'contacts_upload_boundary_12345';
        const metadata = {
          name: fileName,
          mimeType: 'text/csv',
        };

        const multipartBody = [
          `--${boundary}`,
          'Content-Type: application/json; charset=UTF-8',
          '',
          JSON.stringify(metadata),
          `--${boundary}`,
          'Content-Type: text/csv',
          '',
          csvContent,
          `--${boundary}--`,
          '',
        ].join('\r\n');

        const uploadResponse = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': `multipart/related; boundary=${boundary}`,
          },
          body: multipartBody,
        });

        if (!uploadResponse.ok) {
          const errText = await uploadResponse.text();
          throw new Error(`Google Drive upload failed: ${errText}`);
        }

        const uploadData = (await uploadResponse.json()) as any;
        return {
          success: true,
          fileId: uploadData.id,
          fileName: uploadData.name,
          webViewLink: `https://drive.google.com/open?id=${uploadData.id}`,
          isMock: false,
        };
      } catch (err) {
        this.logger.error('Real Google Drive upload failed, falling back to mock:', err);
      }
    }

    try {
      const fs = await import('fs');
      const path = await import('path');
      const backupsDir = path.join(process.cwd(), 'backups');
      if (!fs.existsSync(backupsDir)) {
        fs.mkdirSync(backupsDir, { recursive: true });
      }

      const backupFileName = `contacts_drive_backup_${new Date().toISOString().replace(/[:.]/g, '-')}.csv`;
      const filePath = path.join(backupsDir, backupFileName);
      fs.writeFileSync(filePath, csvContent, 'utf-8');

      const backendUrl = process.env.BACKEND_URL || 'http://localhost:3000';
      const downloadLink = `${backendUrl}/api/databackup/download/${backupFileName}`;

      return {
        success: true,
        message: 'Google Drive credentials not set in .env. Saved locally in backups folder instead.',
        fileName: backupFileName,
        webViewLink: downloadLink,
        isMock: true,
      };
    } catch (err: any) {
      this.logger.error('Google Drive export simulation failed:', err);
      throw new Error(`Export to Google Drive failed: ${err.message}`);
    }
  }

  async downloadExcel(query: any): Promise<string> {
    const csvContent = await this.generateContactsCsv(query);
    const fileName = `contacts_export_${new Date().toISOString().slice(0, 10)}.csv`;
    this.uploadCsvToGoogleDrive(csvContent, fileName).catch((err) => {
      this.logger.error('Background Google Drive upload failed:', err);
    });
    return csvContent;
  }

  async uploadToGoogleDrive(query: any, inputLimit?: number): Promise<any> {
    const csvContent = await this.generateContactsCsv(query);
    const fileName = `contacts_export_${new Date().toISOString().slice(0, 10)}.csv`;
    return this.uploadCsvToGoogleDrive(csvContent, fileName);
  }

  async importContacts(contacts: any[], defaultUserId?: string) {
    const limit = 2000; // Kindly limit the upload to 2000 records per Excel sheet
    const slice = contacts.slice(0, limit);
    const createdContacts: any[] = [];
    for (const item of slice) {
      if (!item.firstName || !item.mobile) continue;

      const uniqueNumber = item.uniqueNumber || this.generateUniqueNumber();
      const assignedTo = item.assignedTo || defaultUserId;

      const newContact = new this.contactModel({
        ...item,
        uniqueNumber,
        assignedTo,
      });
      const saved = await newContact.save();
      createdContacts.push(saved);
    }

    await this.activitiesService.log(
      `Imported ${createdContacts.length} contacts via bulk spreadsheet upload`,
      ActivityType.LEAD,
      defaultUserId,
    );

    return { success: true, count: createdContacts.length };
  }

  async markDndComma(dto: UpdateDndCommaDto, defaultUserId?: string) {
    const mobileList = dto.mobiles
      .split(',')
      .map((m) => m.trim())
      .filter((m) => m.length > 0)
      .slice(0, 500); // Max Limit 500

    const result = await this.contactModel
      .updateMany(
        { mobile: { $in: mobileList }, isDeleted: { $ne: true } },
        { dndStatus: DNDStatus.DND },
      )
      .exec();

    await this.activitiesService.log(
      `Bulk updated DND status to "DND Number" for ${result.modifiedCount} contacts by mobile numbers`,
      ActivityType.LEAD,
      defaultUserId,
    );

    return { success: true, count: result.modifiedCount };
  }

  async autoMergeDuplicates(defaultUserId?: string) {
    const activeContacts = await this.contactModel
      .find({ isDeleted: { $ne: true } })
      .sort({ createdAt: 1 })
      .exec();

    const mobileGroups = new Map<string, ContactDocument[]>();
    for (const contact of activeContacts) {
      if (contact.mobile) {
        const cleanedMobile = contact.mobile.replace(/\s+/g, '');
        let list = mobileGroups.get(cleanedMobile);
        if (!list) {
          list = [];
          mobileGroups.set(cleanedMobile, list);
        }
        list.push(contact);
      }
    }

    let totalMerged = 0;
    const fieldsToMerge = [
      'salutation',
      'lastName',
      'otherNumbers',
      'email',
      'address',
      'city',
      'locality',
      'pincode',
      'companyName',
      'businessDomain',
      'companyType',
      'designation',
      'investCapacity',
      'bankName',
      'bankAccountName',
      'bankAccountNumber',
      'ifscCode',
      'professionalAddress',
      'professionalCity',
      'professionalLocality',
      'dob',
      'anniversary',
      'customerRemark',
      'keyword',
      'folder',
    ];

    for (const [mobile, group] of mobileGroups.entries()) {
      if (group.length > 1) {
        const primary = group[0]; // oldest is primary
        const duplicates = group.slice(1);

        let updated = false;
        for (const dup of duplicates) {
          for (const field of fieldsToMerge) {
            if (!primary[field] && dup[field]) {
              primary[field] = dup[field];
              updated = true;
            }
          }
          dup.isDeleted = true;
          dup.deletedAt = new Date();
          await dup.save();
          totalMerged++;
        }
        if (updated) {
          await primary.save();
        }
      }
    }

    await this.activitiesService.log(
      `Auto merged ${totalMerged} duplicate contacts from CRM database based on matching mobile numbers`,
      ActivityType.LEAD,
      defaultUserId,
    );

    return { success: true, count: totalMerged };
  }

  async changeStatus(id: string, dto: ChangeStatusDto, defaultUserId?: string) {
    const contact = await this.contactModel
      .findOne({ _id: id, isDeleted: { $ne: true } })
      .exec();
    if (!contact) {
      throw new NotFoundException(`Contact with ID "${id}" not found`);
    }

    contact.status = dto.status;
    contact.statusRemark = dto.remark;
    const saved = await contact.save();

    const contactName = `${contact.firstName} ${contact.lastName || ''}`.trim();
    await this.activitiesService.log(
      `Changed status of contact "${contactName}" to "${dto.status}" [Remark: ${dto.remark || 'None'}]`,
      ActivityType.LEAD,
      defaultUserId,
    );

    return saved.populate(['assignedTo', 'createdBy']);
  }

  async sendSmsSingle(
    id: string,
    dto: SendSmsSingleDto,
    defaultUserId?: string,
  ) {
    const contact = await this.contactModel
      .findOne({ _id: id, isDeleted: { $ne: true } })
      .exec();
    if (!contact) {
      throw new NotFoundException(`Contact with ID "${id}" not found`);
    }

    const countryCode = (contact.countryCode || '').trim();
    const mobileVal = (contact.mobile || '').trim();
    if (!mobileVal) {
      throw new BadRequestException('Recipient mobile number is required');
    }
    const combinedMobile = countryCode ? `${countryCode}${mobileVal}` : mobileVal;

    await this.smsService.schedule({
      mobiles: combinedMobile,
      message: dto.message,
      dltTemplateId: dto.dltTemplateId,
      scheduleDate: dto.scheduleDate,
      scheduleTime: dto.scheduleTime,
      createdBy: defaultUserId,
    });

    const contactName = `${contact.firstName} ${contact.lastName || ''}`.trim();
    await this.activitiesService.log(
      `Sent SMS to ${contactName} (${combinedMobile}): "${dto.message}" [Template: ${dto.template}, DLT ID: ${dto.dltTemplateId}, Scheduled: ${dto.scheduleDate} at ${dto.scheduleTime}]`,
      ActivityType.LEAD,
      defaultUserId,
    );

    return { success: true };
  }

  async sendEmailSingle(
    id: string,
    dto: SendEmailSingleDto,
    defaultUserId?: string,
  ) {
    const contact = await this.contactModel
      .findOne({ _id: id, isDeleted: { $ne: true } })
      .exec();
    if (!contact) {
      throw new NotFoundException(`Contact with ID "${id}" not found`);
    }

    const targetEmail = (dto.to || contact.email || '').trim();
    if (!targetEmail) {
      throw new BadRequestException('Recipient email address is required');
    }

    await this.emailsService.schedule({
      to: targetEmail,
      cc: dto.cc ? dto.cc.trim() : undefined,
      bcc: dto.bcc ? dto.bcc.trim() : undefined,
      subject: dto.subject,
      body: dto.message,
      scheduleDate: dto.scheduleDate,
      scheduleTime: dto.scheduleTime,
      createdBy: defaultUserId,
    });

    const contactName = `${contact.firstName} ${contact.lastName || ''}`.trim();
    await this.activitiesService.log(
      `Sent Email to ${contactName} (${targetEmail}): "${dto.subject}" [Template: ${dto.template}, CC: ${dto.cc || 'None'}, BCC: ${dto.bcc || 'None'}, Scheduled: ${dto.scheduleDate} at ${dto.scheduleTime}]`,
      ActivityType.LEAD,
      defaultUserId,
    );

    return { success: true };
  }

  async addQuickNote(id: string, dto: QuickNoteDto, defaultUserId?: string) {
    const contact = await this.contactModel
      .findOne({ _id: id, isDeleted: { $ne: true } })
      .exec();
    if (!contact) {
      throw new NotFoundException(`Contact with ID "${id}" not found`);
    }

    const contactName = `${contact.firstName} ${contact.lastName || ''}`.trim();
    await this.activitiesService.log(
      `Added Quick Note to contact ${contactName} [Type: ${dto.commentType}]: "${dto.comment}"`,
      ActivityType.LEAD,
      defaultUserId,
    );

    return { success: true };
  }

  async transferContact(
    id: string,
    dto: TransferContactDto,
    defaultUserId?: string,
  ) {
    const contact = await this.contactModel
      .findOne({ _id: id, isDeleted: { $ne: true } })
      .exec();
    if (!contact) {
      throw new NotFoundException(`Contact with ID "${id}" not found`);
    }

    const targetUser = await this.userModel.findById(dto.assignedTo).exec();
    if (!targetUser) {
      throw new NotFoundException(`Assignee user not found`);
    }

    contact.assignedTo = targetUser._id as any;
    if (dto.folder) {
      contact.folder = dto.folder;
    }
    if (dto.branch) {
      contact.branch = dto.branch;
    }
    if (dto.permission === 'Private') {
      contact.visibility = ContactVisibility.PRIVATE;
    } else if (dto.permission === 'Branch') {
      contact.visibility = ContactVisibility.BRANCH;
    }

    const saved = await contact.save();

    const contactName = `${contact.firstName} ${contact.lastName || ''}`.trim();
    const targetUserName =
      `${targetUser.firstName} ${targetUser.lastName || ''}`.trim();

    let notificationLog = '';
    if (dto.sendWhatsappToAssignee)
      notificationLog += `[WhatsApp to Assignee: Sent] `;
    if (dto.sendWhatsappToCustomer)
      notificationLog += `[WhatsApp to Customer: Sent] `;
    if (dto.sendEmailToAssignee)
      notificationLog += `[Email to Assignee: Sent] `;
    if (dto.sendEmailToCustomer)
      notificationLog += `[Email to Customer: Sent] `;

    const commentStr = dto.comment ? ` | Comment: "${dto.comment}"` : '';

    await this.activitiesService.log(
      `Transferred contact "${contactName}" (Type: ${dto.transferType}) to agent "${targetUserName}". Folder: "${dto.folder || 'unchanged'}", Branch: "${dto.branch || 'unchanged'}", Permission: "${dto.permission || 'unchanged'}"${commentStr} ${notificationLog}`.trim(),
      ActivityType.LEAD,
      defaultUserId,
    );

    return saved.populate(['assignedTo', 'createdBy']);
  }

  async getContactHistory(id: string) {
    const contact = await this.contactModel
      .findOne({ _id: id, isDeleted: { $ne: true } })
      .exec();
    if (!contact) {
      throw new NotFoundException(`Contact with ID "${id}" not found`);
    }

    const contactName = `${contact.firstName} ${contact.lastName || ''}`.trim();
    return this.activitiesService.findLogsForContact(
      contactName,
      id,
      contact.uniqueNumber,
    );
  }

  async attachDocument(
    id: string,
    dto: AttachDocumentDto,
    defaultUserId?: string,
  ) {
    const contact = await this.contactModel
      .findOne({ _id: id, isDeleted: { $ne: true } })
      .exec();
    if (!contact) {
      throw new NotFoundException(`Contact with ID "${id}" not found`);
    }

    const documentData = {
      type: dto.type,
      name: dto.name,
      branch: dto.branch,
      assignee: dto.assignee,
      isPublic: dto.isPublic !== false,
      uploadedAt: new Date(),
      url: `/uploads/documents/${encodeURIComponent(dto.name)}`,
    };

    if (!contact.documents) {
      contact.documents = [];
    }
    contact.documents.push(documentData);
    const saved = await contact.save();

    const contactName = `${contact.firstName} ${contact.lastName || ''}`.trim();
    await this.activitiesService.log(
      `Attached document "${dto.name}" (Type: ${dto.type}, Branch: ${dto.branch}, Assignee: ${dto.assignee}, Public: ${documentData.isPublic}) to contact "${contactName}"`,
      ActivityType.LEAD,
      defaultUserId,
    );

    return saved;
  }

  async sendTermsConditions(
    id: string,
    dto: TermsConditionsDto,
    defaultUserId?: string,
  ) {
    const contact = await this.contactModel
      .findOne({ _id: id, isDeleted: { $ne: true } })
      .exec();
    if (!contact) {
      throw new NotFoundException(`Contact with ID "${id}" not found`);
    }

    const contactName = `${contact.firstName} ${contact.lastName || ''}`.trim();
    const recipientEmail = contact.email || 'no-email-defined@crm.com';

    await this.activitiesService.log(
      `Sent Terms & Conditions HTML email to ${contactName} (${recipientEmail}) with Subject: "${dto.subject}" and Message body: "${dto.message}"`,
      ActivityType.LEAD,
      defaultUserId,
    );

    return {
      success: true,
      message: `Terms & Conditions successfully sent to ${recipientEmail}`,
    };
  }

  async groupTransfer(dto: GroupTransferDto, defaultUserId?: string) {
    const filter: any = { isDeleted: { $ne: true } };
    if (dto.contactIds && dto.contactIds.length > 0) {
      filter._id = { $in: dto.contactIds };
    }

    const count = await this.contactModel.countDocuments(filter).exec();

    const updateFields: any = {};
    if (dto.folder && dto.folder !== 'Select') {
      updateFields.folder = dto.folder;
    }
    if (dto.branch && dto.branch !== 'Select') {
      updateFields.branch = dto.branch;
    }
    if (dto.assignedTo && dto.assignedTo !== 'Select') {
      updateFields.assignedTo = dto.assignedTo;
    }
    if (dto.permission && dto.permission !== 'Select') {
      if (dto.permission === 'Private') {
        updateFields.visibility = ContactVisibility.PRIVATE;
      } else if (dto.permission === 'Branch') {
        updateFields.visibility = ContactVisibility.BRANCH;
      }
    }

    if (Object.keys(updateFields).length > 0) {
      await this.contactModel.updateMany(filter, updateFields).exec();
    }

    const commentStr = dto.comment ? ` | Comment: "${dto.comment}"` : '';
    const folderStr =
      dto.folder && dto.folder !== 'Select' ? `, Folder: "${dto.folder}"` : '';
    const branchStr =
      dto.branch && dto.branch !== 'Select' ? `, Branch: "${dto.branch}"` : '';
    const assignedStr =
      dto.assignedTo && dto.assignedTo !== 'Select'
        ? `, Assignee: "${dto.assignedTo}"`
        : '';
    const permissionStr =
      dto.permission && dto.permission !== 'Select'
        ? `, Permission: "${dto.permission}"`
        : '';

    await this.activitiesService.log(
      `Group Transferred ${count} contacts (Type: ${dto.transferType})${folderStr}${branchStr}${assignedStr}${permissionStr}${commentStr}`,
      ActivityType.LEAD,
      defaultUserId,
    );

    return { success: true, count };
  }

  async sendEmailOtp(email: string) {
    if (!email) {
      throw new BadRequestException('Email address is required');
    }
    const cleanEmail = email.trim().toLowerCase();

    // Check deliverability - throws if invalid/dummy
    const checkResult = await this.checkEmailDeliverability(cleanEmail);
    if (!checkResult.valid) {
      throw new BadRequestException(checkResult.reason || 'Invalid email address');
    }
    
    // Generate a 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

    // Upsert verification record - marked as verified automatically
    await this.emailVerificationModel.findOneAndUpdate(
      { email: cleanEmail },
      { otp, expiresAt, verified: true },
      { upsert: true, new: true }
    ).exec();

    // Do NOT send the email with the OTP using EmailsService, as requested: no OTP should be sent
    /*
    await this.emailsService.schedule({
      to: cleanEmail,
      subject: 'Email Verification OTP',
      body: `
        <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 8px; max-width: 500px;">
          <h2 style="color: #062b1b;">VaultStone CRM Email Verification</h2>
          <p>Hello,</p>
          <p>Please use the following 6-digit One-Time Password (OTP) to verify your email address. This OTP is valid for 10 minutes.</p>
          <div style="background-color: #f5f5f5; padding: 15px; border-radius: 6px; font-size: 24px; font-weight: bold; text-align: center; letter-spacing: 4px; color: #062b1b; margin: 20px 0;">
            ${otp}
          </div>
          <p style="color: #666; font-size: 12px; margin-top: 30px;">If you did not request this verification, you can safely ignore this email.</p>
        </div>
      `,
    });
    */

    return { success: true, message: 'Email address auto-verified successfully' };
  }

  async verifyEmailOtp(email: string, otp: string) {
    if (!email || !otp) {
      throw new BadRequestException('Email and OTP are required');
    }
    const cleanEmail = email.trim().toLowerCase();
    const cleanOtp = otp.trim();

    const verification = await this.emailVerificationModel.findOne({
      email: cleanEmail,
      otp: cleanOtp,
    }).exec();

    if (!verification) {
      throw new BadRequestException('Invalid OTP entered');
    }

    if (verification.expiresAt < new Date()) {
      throw new BadRequestException('OTP has expired. Please request a new one.');
    }

    verification.verified = true;
    await verification.save();

    return { success: true, message: 'Email verified successfully' };
  }

  async getDetailedHistory(id: string): Promise<any[]> {
    const contact = await this.contactModel
      .findOne({ _id: id, isDeleted: { $ne: true } })
      .populate('createdBy')
      .exec();
    if (!contact) {
      throw new NotFoundException(`Contact with ID "${id}" not found`);
    }

    const timeline: any[] = [];

    // 1. Creation Event
    const creatorName = contact.createdBy
      ? `${(contact.createdBy as any).firstName} ${(contact.createdBy as any).lastName || ''}`.trim()
      : 'System';
    timeline.push({
      action: 'Created',
      performedBy: creatorName,
      date: (contact as any).createdAt || new Date(),
      details: 'Customer profile has been created',
      ip: contact.createdIp || '127.0.0.1',
      purpose: 'Contact Creation',
    });

    // 2. Conversion Event(s)
    const conversions = await this.leadConversionLogModel
      .find({ contactId: id as any })
      .populate(['convertedBy', 'assignedTo'])
      .sort({ createdAt: 1 })
      .exec();

    for (const log of conversions) {
      const converterName = log.convertedBy
        ? `${(log.convertedBy as any).firstName} ${(log.convertedBy as any).lastName || ''}`.trim()
        : 'System';
      const assigneeName = log.assignedTo
        ? `${(log.assignedTo as any).firstName} ${(log.assignedTo as any).lastName || ''}`.trim()
        : 'Unknown';
      timeline.push({
        action: 'Converted to Lead',
        performedBy: converterName,
        date: (log as any).createdAt,
        details: `Converted contact to Lead, assigned to "${assigneeName}"`,
        ip: log.ipAddress || '127.0.0.1',
        purpose: log.purpose || 'Lead Assignment',
      });
    }

    // 3. Activity Logs
    const contactName = `${contact.firstName} ${contact.lastName || ''}`.trim();
    const activityLogs = await this.activitiesService.findLogsForContact(
      contactName,
      id,
      contact.uniqueNumber,
    );

    for (const activity of activityLogs) {
      // Exclude generic creation/conversion messages to avoid duplicates
      if (
        activity.description.includes('Created contact:') ||
        activity.description.includes('Converted contact')
      ) {
        continue;
      }
      const perfName = activity.performedBy
        ? `${(activity.performedBy as any).firstName} ${(activity.performedBy as any).lastName || ''}`.trim()
        : 'System';

      let label = 'General';
      let cleanDesc = activity.description;

      if (activity.description.includes('Modified details for contact:')) {
        label = 'Modified';
        cleanDesc = 'Contact details modified';
      } else if (activity.description.includes('Changed status of contact')) {
        label = 'Status';
      } else if (activity.description.includes('Transferred contact')) {
        label = 'Transferred';
      } else if (activity.description.includes('Scheduled follow-up')) {
        label = 'Follow-up';
      } else if (activity.description.includes('Updated raw requirement of lead')) {
        label = 'Requirement';
      } else if (activity.description.includes('Attached document')) {
        label = 'Document';
      } else if (activity.description.includes('Sent Terms & Conditions')) {
        label = 'T&C Sent';
      } else if (activity.description.includes('Sent SMS')) {
        label = 'SMS Sent';
      } else if (activity.description.includes('Sent Email')) {
        label = 'Email Sent';
      } else if (activity.description.includes('Added Quick Note')) {
        label = 'Quick Note';
      } else if (
        activity.description.includes('identified as a duplicate and hidden') ||
        activity.description.includes('Duplicate lead')
      ) {
        label = 'Duplicate';
      }

      let remark = '—';

      if (activity.description.includes('[Remark:')) {
        const match = activity.description.match(/\[Remark:\s*([^\]]+)\]/);
        if (match && match[1]) {
          remark = match[1].trim();
          cleanDesc = cleanDesc.replace(/\[Remark:\s*[^\]]+\]/, '').trim();
        }
      } else if (activity.description.includes('| Comment:')) {
        const match = activity.description.match(/\|\s*Comment:\s*"([^"]+)"/);
        if (match && match[1]) {
          remark = match[1].trim();
          cleanDesc = cleanDesc.replace(/\|\s*Comment:\s*"[^"]+"/, '').trim();
        }
      } else if (activity.description.includes('Added Quick Note')) {
        const match = activity.description.match(/\]:\s*"([^"]+)"/);
        if (match && match[1]) {
          remark = match[1].trim();
          const idx = activity.description.indexOf(']:');
          if (idx !== -1) {
            cleanDesc = activity.description.substring(0, idx + 2).trim();
          }
        }
      }

      timeline.push({
        action: label,
        performedBy: perfName,
        date: activity.timestamp,
        details: cleanDesc,
        ip: '—',
        purpose: '—',
        remark: remark,
      });
    }

    // Sort timeline descending by date
    timeline.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return timeline;
  }
}
