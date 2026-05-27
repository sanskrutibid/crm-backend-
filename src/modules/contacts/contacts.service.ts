import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Contact, ContactDocument, DNDStatus, EmailStatus, ContactVisibility } from './schemas/contact.schema';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';
import { QueryContactDto } from './dto/query-contact.dto';
import { User, UserDocument } from '../users/schemas/user.schema';
import { ActivitiesService } from '../activities/activities.service';
import { ActivityType } from '../activities/schemas/activity.schema';

@Injectable()
export class ContactsService implements OnModuleInit {
  constructor(
    @InjectModel(Contact.name) private readonly contactModel: Model<ContactDocument>,
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
          customerRemark: 'High intent buyer, looking for immediate flats in Dhantoli.',
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
        console.log('🌱 Successfully seeded initial Contacts directory database collection.');
      } else {
        console.log('⚠️ No users found in database to assign seed Contacts to. Seeding skipped.');
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

  async create(createContactDto: CreateContactDto, defaultUserId: string): Promise<ContactDocument> {
    const assignedTo = createContactDto.assignedTo || defaultUserId;
    const uniqueNumber = createContactDto.uniqueNumber || this.generateUniqueNumber();

    const newContact = new this.contactModel({
      ...createContactDto,
      assignedTo,
      uniqueNumber,
    });
    const savedContact = await newContact.save();

    // Log the contact addition in the CRM Activity Feed
    const name = `${savedContact.firstName} ${savedContact.lastName || ''}`.trim();
    await this.activitiesService.log(
      `Created contact: "${name}" [Type: ${savedContact.customerType}] under ${savedContact.branch} branch`,
      ActivityType.LEAD,
      defaultUserId,
    );

    return savedContact.populate('assignedTo');
  }

  async findAll(query: QueryContactDto): Promise<{ contacts: ContactDocument[]; total: number }> {
    const { customerType, contactType, branch, assignedTo, search, sortBy = 'createdAt', sortOrder = 'desc', updatedSince, page = 1, limit = 10 } = query;
    const filter: any = {};

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
    
    // Pagination bypass logic: If limit is >= 99999, return all matching records at once
    const queryChain = this.contactModel.find(filter).populate('assignedTo').sort(sortOption);
    
    if (limit > 0 && limit < 99999) {
      queryChain.skip((page - 1) * limit).limit(limit);
    }

    const contacts = await queryChain.exec();
    return { contacts, total };
  }

  async findOne(id: string): Promise<ContactDocument> {
    const contact = await this.contactModel.findById(id).populate('assignedTo').exec();
    if (!contact) {
      throw new NotFoundException(`Contact with ID "${id}" not found`);
    }
    return contact;
  }

  async update(id: string, updateContactDto: UpdateContactDto): Promise<ContactDocument> {
    const originalContact = await this.contactModel.findById(id).exec();
    if (!originalContact) {
      throw new NotFoundException(`Contact with ID "${id}" not found`);
    }

    const updatedContact = await this.contactModel
      .findByIdAndUpdate(id, updateContactDto, { new: true })
      .populate('assignedTo')
      .exec();

    if (!updatedContact) {
      throw new NotFoundException(`Contact with ID "${id}" not found`);
    }

    // Log the contact update in the CRM Activity Feed
    const name = `${updatedContact.firstName} ${updatedContact.lastName || ''}`.trim();
    await this.activitiesService.log(
      `Modified details for contact: "${name}"`,
      ActivityType.LEAD,
    );

    return updatedContact;
  }

  async remove(id: string): Promise<void> {
    const contact = await this.contactModel.findById(id).exec();
    if (!contact) {
      throw new NotFoundException(`Contact with ID "${id}" not found`);
    }

    await this.contactModel.findByIdAndDelete(id).exec();

    // Log the contact deletion in the CRM Activity Feed
    const name = `${contact.firstName} ${contact.lastName || ''}`.trim();
    await this.activitiesService.log(
      `Deleted contact: "${name}"`,
      ActivityType.LEAD,
    );
  }
}
