import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Lead, LeadDocument, LeadStatus, LeadTemperature, LeadVisibility } from './schemas/lead.schema';
import { Contact, ContactDocument } from '../contacts/schemas/contact.schema';
import { User, UserDocument } from '../users/schemas/user.schema';
import { CreateLeadDto } from './dto/create-lead.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';
import { QueryLeadDto } from './dto/query-lead.dto';
import { ActivitiesService } from '../activities/activities.service';
import { ActivityType } from '../activities/schemas/activity.schema';
import { LeadsAIService } from './leads-ai.service';

@Injectable()
export class LeadsService implements OnModuleInit {
  constructor(
    @InjectModel(Lead.name) private readonly leadModel: Model<LeadDocument>,
    @InjectModel(Contact.name) private readonly contactModel: Model<ContactDocument>,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    private readonly activitiesService: ActivitiesService,
    private readonly leadsAiService: LeadsAIService,
  ) {}

  /**
   * Seed Chirag Ashtankar's lead profile linked to Dayamati's contact profile on boot if collection is empty.
   */
  async onModuleInit() {
    const leadCount = await this.leadModel.countDocuments().exec();
    if (leadCount === 0) {
      const defaultUser = await this.userModel.findOne().exec();
      const defaultContact = await this.contactModel.findOne({ firstName: 'Dayamati' }).exec();

      if (defaultUser && defaultContact) {
        const seedLead: Partial<Lead> = {
          contactId: defaultContact._id as any,
          requirement: 'Y88006356 Rs. 1.38 Crore, 3 Bed, for Sale in Riddhi Siddhi, Pande Layout , for',
          followupNote: 'Followup on flat details and pricing terms',
          scheduleDate: '2026-06-19', // 19-Jun-2026 YYYY-MM-DD
          scheduleTime: '12:39pm',
          score: 4.50,
          keywords: 'Dhantoli ,172Sqft flat 2cr',
          folder: 'Dhantoli Premium Folder',
          source: 'Campaigns',
          branch: 'Global Team',
          assignedTo: defaultUser._id as any,
          visibility: LeadVisibility.PRIVATE,
          termsShared: true,
          temperature: LeadTemperature.COLD,
          status: LeadStatus.IN_PROGRESS,
          nextRemark: 'no response',
          outcome: 'Said Not Looking Any Property Now',
          interestedIn: 'Rs. 1.38 Crore, 3 Bed, for Sale in Riddhi Siddhi, Pande Layout',
          purpose: 'Follow-Up Scheduled',
          assignDate: new Date(),
          createdBy: defaultUser._id as any,
          updatedBy: defaultUser._id as any,
        };
        await this.leadModel.create(seedLead);
        console.log('🌱 Successfully seeded initial CRM Leads database collection.');
      } else {
        console.log('⚠️ No users or contacts found in database to assign seed Lead to. Seeding skipped.');
      }
    }
  }

  async create(createLeadDto: CreateLeadDto, defaultUserId: string): Promise<LeadDocument> {
    const assignedTo = createLeadDto.assignedTo || defaultUserId;

    // Call Google Gemini AI to analyze raw text customer requirement and followup notes
    const aiAnalysis = await this.leadsAiService.analyzeLead(
      createLeadDto.requirement,
      createLeadDto.followupNote,
    );

    // Merge AI predictions only if the user didn't explicitly override them with manual values
    const score = createLeadDto.score !== undefined ? createLeadDto.score : aiAnalysis.score;
    const temperature = createLeadDto.temperature !== undefined ? createLeadDto.temperature : aiAnalysis.temperature;
    const keywords = createLeadDto.keywords !== undefined && createLeadDto.keywords !== '' ? createLeadDto.keywords : aiAnalysis.keywords;
    const nextRemark = createLeadDto.nextRemark !== undefined && createLeadDto.nextRemark !== 'no response' ? createLeadDto.nextRemark : aiAnalysis.nextRemark;

    const newLead = new this.leadModel({
      ...createLeadDto,
      score,
      temperature,
      keywords,
      nextRemark,
      assignedTo,
      createdBy: defaultUserId,
      updatedBy: defaultUserId,
      assignDate: new Date(),
    });
    const savedLead = await newLead.save();

    // Log lead creation
    const contact = await this.contactModel.findById(createLeadDto.contactId).exec();
    const customerName = contact ? `${contact.firstName} ${contact.lastName || ''}`.trim() : 'Unknown';
    await this.activitiesService.log(
      `Added lead: "${customerName}" for requirement: "${savedLead.requirement.substring(0, 30)}..."`,
      ActivityType.LEAD,
      defaultUserId,
    );

    return savedLead.populate(['contactId', 'assignedTo']);
  }

  async findAll(query: QueryLeadDto): Promise<{ leads: LeadDocument[]; total: number }> {
    const { viewType = 'all', search, assignedTo, updatedSince, page = 1, limit = 10 } = query;
    const filter: any = {};

    // 1. Referenced Search mapping: Search across Contact name, email, mobile
    if (search) {
      const matchedContacts = await this.contactModel
        .find({
          $or: [
            { firstName: new RegExp(search, 'i') },
            { lastName: new RegExp(search, 'i') },
            { mobile: new RegExp(search, 'i') },
            { email: new RegExp(search, 'i') },
          ],
        })
        .select('_id')
        .exec();

      const contactIds = matchedContacts.map((c) => c._id);

      filter.$or = [
        { contactId: { $in: contactIds } },
        { requirement: new RegExp(search, 'i') },
        { keywords: new RegExp(search, 'i') },
        { branch: new RegExp(search, 'i') },
        { source: new RegExp(search, 'i') },
      ];
    }

    if (assignedTo) {
      filter.assignedTo = assignedTo;
    }

    // Sync Filter: Retrieve only records added or modified after this timestamp
    if (updatedSince) {
      filter.updatedAt = { $gte: new Date(updatedSince) };
    }

    // 2. Custom views (today, open, backlog, pending, calendar, all)
    const now = new Date();
    const format1 = now.toISOString().split('T')[0]; // "2026-05-26"
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const format2 = `${now.getDate()}-${months[now.getMonth()]}-${now.getFullYear()}`; // "26-May-2026"

    switch (viewType) {
      case 'today':
        filter.status = LeadStatus.IN_PROGRESS;
        filter.scheduleDate = { $in: [format1, format2] };
        break;
      case 'open':
      case 'pending':
        filter.status = LeadStatus.IN_PROGRESS;
        break;
      case 'backlog':
        // Outstanding follow-up in the past
        filter.status = LeadStatus.IN_PROGRESS;
        filter.scheduleDate = { $lt: format1 };
        break;
      case 'calendar':
        filter.scheduleDate = { $exists: true, $ne: '' };
        break;
      case 'all':
      default:
        // Fetch both open, closed, won, lost
        break;
    }

    const total = await this.leadModel.countDocuments(filter).exec();

    // Pagination bypass logic: If limit is >= 99999, return all matching records at once
    const queryChain = this.leadModel
      .find(filter)
      .populate(['contactId', 'assignedTo', 'createdBy', 'updatedBy'])
      .sort({ createdAt: -1 });

    if (limit > 0 && limit < 99999) {
      queryChain.skip((page - 1) * limit).limit(limit);
    }

    const leads = await queryChain.exec();
    return { leads, total };
  }

  async findOne(id: string): Promise<LeadDocument> {
    const lead = await this.leadModel
      .findById(id)
      .populate(['contactId', 'assignedTo', 'createdBy', 'updatedBy'])
      .exec();

    if (!lead) {
      throw new NotFoundException(`Lead with ID "${id}" not found`);
    }
    return lead;
  }

  async update(id: string, updateLeadDto: UpdateLeadDto): Promise<LeadDocument> {
    const originalLead = await this.leadModel.findById(id).exec();
    if (!originalLead) {
      throw new NotFoundException(`Lead with ID "${id}" not found`);
    }

    const updatedLead = await this.leadModel
      .findByIdAndUpdate(id, updateLeadDto, { new: true })
      .populate(['contactId', 'assignedTo', 'createdBy', 'updatedBy'])
      .exec();

    if (!updatedLead) {
      throw new NotFoundException(`Lead with ID "${id}" not found`);
    }

    // Log the change
    if (updateLeadDto.status && originalLead.status !== updateLeadDto.status) {
      await this.activitiesService.log(
        `Updated stage of lead for "${(updatedLead.contactId as any).firstName}" to "${updatedLead.status}"`,
        ActivityType.LEAD,
      );
    } else {
      await this.activitiesService.log(
        `Modified lead details for "${(updatedLead.contactId as any).firstName}"`,
        ActivityType.LEAD,
      );
    }

    return updatedLead;
  }

  async remove(id: string): Promise<void> {
    const lead = await this.leadModel.findById(id).populate('contactId').exec();
    if (!lead) {
      throw new NotFoundException(`Lead with ID "${id}" not found`);
    }

    await this.leadModel.findByIdAndDelete(id).exec();

    // Log deletion action
    const customerName = lead.contactId ? `${lead.contactId.firstName} ${lead.contactId.lastName || ''}`.trim() : 'Unknown';
    await this.activitiesService.log(
      `Deleted lead: "${customerName}"`,
      ActivityType.LEAD,
    );
  }
}
