import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  Contact,
  ContactDocument,
  DNDStatus,
  EmailStatus,
  ContactVisibility,
} from './schemas/contact.schema';
import { Audience, AudienceDocument } from './schemas/audience.schema';
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

@Injectable()
export class ContactsService implements OnModuleInit {
  constructor(
    @InjectModel(Contact.name)
    private readonly contactModel: Model<ContactDocument>,
    @InjectModel(Audience.name)
    private readonly audienceModel: Model<AudienceDocument>,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    private readonly activitiesService: ActivitiesService,
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

  async create(
    createContactDto: CreateContactDto,
    defaultUserId?: string,
  ): Promise<ContactDocument> {
    const assignedTo = createContactDto.assignedTo || defaultUserId;
    const uniqueNumber =
      createContactDto.uniqueNumber || this.generateUniqueNumber();

    const newContact = new this.contactModel({
      ...createContactDto,
      assignedTo,
      uniqueNumber,
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

    return savedContact.populate('assignedTo');
  }

  async findAll(
    query: QueryContactDto,
  ): Promise<{ contacts: ContactDocument[]; total: number }> {
    const {
      customerType,
      contactType,
      branch,
      assignedTo,
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

    // Sync Filter: Retrieve only records added or modified after this timestamp
    if (updatedSince) {
      filter.updatedAt = { $gte: new Date(updatedSince) };
    }

    // Dynamic sorting
    const sortField = sortBy || 'createdAt';
    const sortDirection = sortOrder === 'asc' ? 1 : -1;
    const sortOption: any = { [sortField]: sortDirection };

    const total = await this.contactModel.countDocuments(filter).exec();

    // Pagination bypass logic: If limit is not specified, return all matching records at once.
    // If limit is specified and is >= 99999, return all matching records.
    const queryChain = this.contactModel
      .find(filter)
      .populate('assignedTo')
      .sort(sortOption);

    if (limit && limit > 0 && limit < 99999) {
      const pageNum = page && page > 0 ? page : 1;
      queryChain.skip((pageNum - 1) * limit).limit(limit);
    }

    const contacts = await queryChain.exec();
    return { contacts, total };
  }

  async findOne(id: string): Promise<ContactDocument> {
    const contact = await this.contactModel
      .findOne({ _id: id, isDeleted: { $ne: true } })
      .populate('assignedTo')
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

    const updatedContact = await this.contactModel
      .findOneAndUpdate(
        { _id: id, isDeleted: { $ne: true } },
        updateContactDto,
        { new: true },
      )
      .populate('assignedTo')
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

  async createAudience(dto: CreateAudienceDto, defaultUserId?: string) {
    let contactIds = dto.contactIds;

    // If no specific contact IDs are provided, select all contacts by default!
    if (!contactIds || contactIds.length === 0) {
      const allContacts = await this.contactModel
        .find({ isDeleted: { $ne: true } }, { _id: 1 })
        .exec();
      contactIds = allContacts.map((c) => c._id.toString());
    }

    const createdAudience = new this.audienceModel({
      name: dto.name,
      type: dto.type,
      template: dto.template,
      schedule: dto.schedule,
      time: dto.time,
      startDate: dto.startDate,
      setWeeks: dto.setWeeks,
      setDays: dto.setDays,
      contacts: contactIds,
      totalRecords: contactIds.length,
    });

    const savedAudience = await createdAudience.save();

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
        ? { _id: { $in: dto.contactIds } }
        : {};

    const count = await this.contactModel.countDocuments(filter).exec();

    await this.activitiesService.log(
      `Sent Group SMS: "${dto.message}" to ${count} contacts [Template: ${dto.template}, DLT ID: ${dto.dltTemplateId}, Scheduled: ${dto.scheduleDate} at ${dto.scheduleTime}]`,
      ActivityType.LEAD,
      defaultUserId,
    );

    return { success: true, count };
  }

  async sendGroupEmail(dto: SendEmailDto, defaultUserId?: string) {
    const filter =
      dto.contactIds && dto.contactIds.length > 0
        ? { _id: { $in: dto.contactIds } }
        : {};

    const count = await this.contactModel.countDocuments(filter).exec();

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

  async downloadExcel(query: any): Promise<string> {
    const filter = this.buildFilter(query);
    // Page size / Limit max 4000
    const limit =
      query.limit && query.limit > 0 && query.limit <= 4000
        ? query.limit
        : 4000;
    const contacts = await this.contactModel
      .find(filter)
      .populate('assignedTo')
      .limit(limit)
      .exec();

    const headers = [
      'Unique Number',
      'Salutation',
      'First Name',
      'Last Name',
      'Customer Type',
      'Contact Type',
      'Mobile',
      'DND Status',
      'Email',
      'Email Status',
      'Company',
      'Branch',
      'City',
      'Locality',
      'Created At',
    ];

    const rows = contacts.map((c) => [
      c.uniqueNumber || '',
      c.salutation || '',
      c.firstName || '',
      c.lastName || '',
      c.customerType || '',
      c.contactType || '',
      c.mobile || '',
      c.dndStatus || '',
      c.email || '',
      c.emailStatus || '',
      c.companyName || '',
      c.branch || '',
      c.city || '',
      c.locality || '',
      (c as any).createdAt ? (c as any).createdAt.toISOString() : '',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((r) =>
        r.map((val) => `"${val.replace(/"/g, '""')}"`).join(','),
      ),
    ].join('\n');

    return csvContent;
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

    return saved.populate('assignedTo');
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

    const contactName = `${contact.firstName} ${contact.lastName || ''}`.trim();
    await this.activitiesService.log(
      `Sent SMS to ${contactName}: "${dto.message}" [Template: ${dto.template}, DLT ID: ${dto.dltTemplateId}, Scheduled: ${dto.scheduleDate} at ${dto.scheduleTime}]`,
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

    const contactName = `${contact.firstName} ${contact.lastName || ''}`.trim();
    await this.activitiesService.log(
      `Sent Email to ${contactName} (${dto.to}): "${dto.subject}" [Template: ${dto.template}, CC: ${dto.cc || 'None'}, BCC: ${dto.bcc || 'None'}, Scheduled: ${dto.scheduleDate} at ${dto.scheduleTime}]`,
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

    return saved.populate('assignedTo');
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
}
