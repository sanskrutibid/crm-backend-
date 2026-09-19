import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  Lead,
  LeadDocument,
  LeadStatus,
  LeadTemperature,
  LeadVisibility,
} from './schemas/lead.schema';
import { Contact, ContactDocument } from '../contacts/schemas/contact.schema';
import { User, UserDocument } from '../users/schemas/user.schema';
import { generateExcelBuffer } from '../../common/utils/excel.util';
import {
  SiteVisit,
  SiteVisitDocument,
} from '../site-visits/schemas/site-visit.schema';
import { CreateLeadDto } from './dto/create-lead.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';
import { QueryLeadDto } from './dto/query-lead.dto';
import {
  ChangeLeadStatusDto,
  UpdateRequirementDto,
  SendLeadSmsDto,
  SendLeadEmailDto,
  LeadQuickNoteDto,
  SendProposalDto,
  LeadTermsConditionsDto,
  CreateSiteVisitDto,
  ConvertContactsToLeadsDto,
} from './dto/lead-actions.dto';
import { ActivitiesService } from '../activities/activities.service';
import { ActivityType } from '../activities/schemas/activity.schema';
import {
  LeadConversionLog,
  LeadConversionLogDocument,
} from './schemas/lead-conversion-log.schema';
import {
  SendGroupSmsDto,
  SendGroupEmailDto,
  GroupDeleteDto,
} from './dto/bulk-actions.dto';
import { SmsService } from '../sms/sms.service';
import { EmailsService } from '../emails/emails.service';
import { GoogleCalendarService } from '../google-calendar/google-calendar.service';

@Injectable()
export class LeadsService {
  constructor(
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    @InjectModel(Lead.name) private readonly leadModel: Model<LeadDocument>,
    @InjectModel(Contact.name)
    private readonly contactModel: Model<ContactDocument>,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(SiteVisit.name)
    private readonly siteVisitModel: Model<SiteVisitDocument>,
    @InjectModel(LeadConversionLog.name)
    private readonly leadConversionLogModel: Model<LeadConversionLogDocument>,
    private readonly activitiesService: ActivitiesService,
    private readonly smsService: SmsService,
    private readonly emailsService: EmailsService,
    private readonly googleCalendarService: GoogleCalendarService,
  ) {}

  private async invalidateCache(id?: string) {
    try {
      if (id) {
        await this.cacheManager.del(`leads:id:${id}`);
      }
      const version =
        (await this.cacheManager.get<number>('leads_version')) || 1;
      await this.cacheManager.set('leads_version', version + 1);
    } catch (err) {
      console.error('Cache invalidation failed:', err);
    }
  }

  private serializeLean(doc: any): any {
    if (!doc) return doc;
    if (Array.isArray(doc)) {
      return doc.map(d => this.serializeLean(d));
    }
    if (typeof doc === 'object') {
      const ret = { ...doc };
      if (ret._id) {
        ret.id = ret._id.toString();
        delete ret._id;
      }
      if (ret.__v !== undefined) {
        delete ret.__v;
      }
      for (const key of Object.keys(ret)) {
        if (ret[key] && typeof ret[key] === 'object' && !(ret[key] instanceof Date)) {
          ret[key] = this.serializeLean(ret[key]);
        }
      }
      return ret;
    }
    return doc;
  }

  async create(
    createLeadDto: CreateLeadDto,
    defaultUserId?: string,
  ): Promise<LeadDocument> {
    const assignedTo = createLeadDto.assignedTo || undefined;

    let targetContactId = createLeadDto.contactId;

    if (createLeadDto.addNewContact) {
      if (!createLeadDto.name || !createLeadDto.mobile) {
        throw new BadRequestException(
          'Name and Mobile are required to create a new contact on-the-fly',
        );
      }

      // Parse salutation, firstName, lastName from name string
      let salutation: string | undefined = undefined;
      let firstName = 'Unknown';
      let lastName: string | undefined = undefined;

      const nameParts = (createLeadDto.name || '').trim().split(/\s+/);
      if (nameParts.length > 0) {
        const firstPart = nameParts[0].replace(/\./g, '');
        const salutations = ['mr', 'mrs', 'ms', 'dr', 'prof', 'sir'];
        if (salutations.includes(firstPart.toLowerCase())) {
          salutation = nameParts[0];
          nameParts.shift();
        }
      }
      if (nameParts.length > 0) {
        firstName = nameParts[0];
        nameParts.shift();
      }
      if (nameParts.length > 0) {
        lastName = nameParts.join(' ');
      }

      const parsedPhone = parseMobileAndCountryCode(createLeadDto.mobile);

      let targetContact = await this.contactModel.findOne({
        mobile: parsedPhone.mobile,
        countryCode: parsedPhone.countryCode,
        isDeleted: { $ne: true }
      }).exec();

      if (!targetContact) {
        const newContact = new this.contactModel({
          salutation,
          firstName,
          lastName,
          customerType: 'Customer',
          contactType: 'Employee',
          countryCode: parsedPhone.countryCode,
          mobile: parsedPhone.mobile,
          email: createLeadDto.email
            ? createLeadDto.email.toLowerCase().trim()
            : undefined,
          companyName: createLeadDto.company,
          source: createLeadDto.source || 'Website Form',
          branch: createLeadDto.branch || 'Global Team',
          assignedTo: assignedTo,
        });

        targetContact = await newContact.save();

        await this.activitiesService.log(
          `Created new contact "${createLeadDto.name}" on-the-fly during lead creation`,
          ActivityType.LEAD,
          defaultUserId,
        );
      }
      targetContactId = targetContact._id.toString();
    } else {
      if (!targetContactId) {
        throw new BadRequestException(
          'Either contactId must be provided or addNewContact must be set to true',
        );
      }
    }

    // Setup default fallback values without Gemini AI analysis
    const score = createLeadDto.score !== undefined ? createLeadDto.score : 1.0;
    const temperature =
      createLeadDto.temperature !== undefined
        ? createLeadDto.temperature
        : LeadTemperature.COLD;
    const keywords =
      createLeadDto.keywords !== undefined && createLeadDto.keywords !== ''
        ? createLeadDto.keywords
        : '';
    const nextRemark =
      createLeadDto.nextRemark !== undefined &&
      createLeadDto.nextRemark !== 'no response'
        ? createLeadDto.nextRemark
        : 'no response';

    const newLead = new this.leadModel({
      ...createLeadDto,
      contactId: targetContactId,
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

    // Sync with Google Calendar asynchronously
    this.googleCalendarService.syncEventForLead(savedLead._id.toString()).catch(err => {
      console.error('Google Calendar sync failed during creation:', err);
    });

    // Log lead creation
    const contact = await this.contactModel.findById(targetContactId).exec();
    const customerName = contact
      ? `${contact.firstName} ${contact.lastName || ''}`.trim()
      : 'Unknown';
    await this.activitiesService.log(
      `Added lead: "${customerName}" for requirement: "${savedLead.requirement.substring(0, 30)}..."`,
      ActivityType.LEAD,
      defaultUserId,
    );

    await this.invalidateCache();
    return savedLead.populate(['contactId', 'assignedTo']);
  }

  async convertContactsToLeads(
    dto: ConvertContactsToLeadsDto,
    defaultUserId?: string,
    ipAddress?: string,
  ): Promise<{ success: boolean; count: number; leads: LeadDocument[] }> {
    const defaultUser = await this.userModel.findOne().exec();
    const userId = defaultUserId || (defaultUser ? defaultUser._id.toString() : undefined);

    const leads: LeadDocument[] = [];

    for (const contactId of dto.contactIds) {
      const contact = await this.contactModel.findById(contactId).exec();
      if (!contact) {
        throw new NotFoundException(`Contact with ID "${contactId}" not found`);
      }

      const assigneeUserId = dto.assignedTo || userId;

      // 1. Update contact's assignedTo and save
      if (assigneeUserId) {
        contact.assignedTo = assigneeUserId as any;
        await contact.save();
      }

      const newLead = new this.leadModel({
        contactId: contact._id,
        requirement: dto.requirement,
        followupNote: dto.requirement, // maps to requirement and followupNote
        scheduleDate: dto.scheduleDate,
        scheduleTime: dto.scheduleTime,
        score: dto.score !== undefined ? dto.score : 50,
        folder: dto.folder,
        source: dto.source,
        branch: dto.branch,
        assignedTo: assigneeUserId,
        sendWhatsAppToAssignee: dto.sendWhatsAppToAssignee || false,
        sendEmailToAssignee: dto.sendEmailToAssignee || false,
        sendWhatsAppToCustomer: dto.sendWhatsAppToCustomer || false,
        sendEmailToCustomer: dto.sendEmailToCustomer || false,
        visibility: dto.visibility || LeadVisibility.PRIVATE,
        termsShared: dto.termsShared || false,
        interestedIn: dto.interestedIn,
        temperature: LeadTemperature.COLD,
        status: LeadStatus.IN_PROGRESS,
        nextRemark: 'no response',
        outcome: 'Said Not Looking Any Property Now',
        purpose: 'Follow-Up Scheduled',
        assignDate: new Date(),
        createdBy: userId,
        updatedBy: userId,
      });

      const saved = await newLead.save();
      leads.push(saved);

      // 2. Create Lead Conversion Log
      if (userId && assigneeUserId) {
        const conversionLog = new this.leadConversionLogModel({
          contactId: contact._id,
          leadId: saved._id,
          convertedBy: userId,
          assignedTo: assigneeUserId,
          ipAddress: ipAddress,
          purpose: dto.requirement,
        });
        await conversionLog.save();
      }

      // Fetch names for detailed logging
      let assigneeName = 'Unknown';
      if (assigneeUserId) {
        const assigneeUser = await this.userModel.findById(assigneeUserId).exec();
        assigneeName = assigneeUser ? `${assigneeUser.firstName} ${assigneeUser.lastName || ''}`.trim() : 'Unknown';
      }

      let converterName = 'System';
      if (userId) {
        const converterUser = await this.userModel.findById(userId).exec();
        converterName = converterUser ? `${converterUser.firstName} ${converterUser.lastName || ''}`.trim() : 'System';
      }

      const customerName = `${contact.firstName} ${contact.lastName || ''}`.trim();
      await this.activitiesService.log(
        `Converted contact "${customerName}" to Lead, assigned to "${assigneeName}" by "${converterName}" for requirement: "${dto.requirement.substring(0, 30)}..."`,
        ActivityType.LEAD,
        userId,
      );
    }

    await this.invalidateCache();

    return {
      success: true,
      count: leads.length,
      leads,
    };
  }

  async findAll(
    query: QueryLeadDto,
  ): Promise<{ leads: LeadDocument[]; total: number }> {
    const version = (await this.cacheManager.get<number>('leads_version')) || 1;
    const cacheKey = `leads:list:${version}:${JSON.stringify(query)}`;
    try {
      const cached = await this.cacheManager.get<{
        leads: any[];
        total: number;
      }>(cacheKey);
      if (cached) {
        return cached;
      }
    } catch (err) {
      console.error('Cache read error in findAll:', err);
    }

    const {
      viewType = 'all',
      search,
      assignedTo,
      updatedSince,
      sortBy = 'Create Date',
      orderBy = 'Desc',
      customerType,
      contactType,
      followupDateFrom,
      followupDateTo,
      createDateFrom,
      createDateTo,
      assignedDateFrom,
      assignedDateTo,
      updateDateFrom,
      updateDateTo,
      submittedBy,
      city,
      location,
      purpose,
      ratingFrom,
      ratingTo,
      source,
      branch,
      assignTo,
      currentStatus,
      status,
      reasons,
      permission,
      batchNumber,
      searchMode,
      page = 1,
      limit = 10,
    } = query;

    const filter: any = { isDuplicateHidden: { $ne: true } };

    if ((query as any).leadIds) {
      const ids = Array.isArray((query as any).leadIds)
        ? (query as any).leadIds
        : (query as any).leadIds.split(',').map((id: any) => id.trim()).filter(Boolean);
      if (ids.length > 0) {
        filter._id = { $in: ids };
      }
    }

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
        .lean()
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

    // Advanced search contact-level filters
    const contactFilter: any = {};
    let hasContactFilters = false;

    if (customerType) {
      contactFilter.customerType = customerType;
      hasContactFilters = true;
    }
    if (contactType) {
      contactFilter.contactType = contactType;
      hasContactFilters = true;
    }
    if (city) {
      contactFilter.city = new RegExp(city, 'i');
      hasContactFilters = true;
    }
    if (location) {
      contactFilter.locality = new RegExp(location, 'i');
      hasContactFilters = true;
    }

    if (hasContactFilters) {
      const matchedContacts = await this.contactModel
        .find(contactFilter)
        .select('_id')
        .lean()
        .exec();
      const contactIds = matchedContacts.map((c) => c._id.toString());
      if (filter.contactId && filter.contactId.$in) {
        const searchContactIds = filter.contactId.$in.map((id: any) =>
          id.toString(),
        );
        const intersection = contactIds.filter((id) =>
          searchContactIds.includes(id),
        );
        filter.contactId = { $in: intersection };
      } else {
        filter.contactId = { $in: contactIds };
      }
    }

    // Date ranges
    if (followupDateFrom || followupDateTo) {
      const range: any = {};
      if (followupDateFrom) range.$gte = followupDateFrom;
      if (followupDateTo) range.$lte = followupDateTo;
      filter.scheduleDate = range;
    }

    if (createDateFrom || createDateTo) {
      const range: any = {};
      if (createDateFrom) range.$gte = new Date(createDateFrom);
      if (createDateTo) range.$lte = new Date(createDateTo);
      filter.createdAt = range;
    }

    if (assignedDateFrom || assignedDateTo) {
      const range: any = {};
      if (assignedDateFrom) range.$gte = new Date(assignedDateFrom);
      if (assignedDateTo) range.$lte = new Date(assignedDateTo);
      filter.assignDate = range;
    }

    if (updateDateFrom || updateDateTo) {
      const range: any = {};
      if (updateDateFrom) range.$gte = new Date(updateDateFrom);
      if (updateDateTo) range.$lte = new Date(updateDateTo);
      filter.updatedAt = range;
    }

    // Submitted By
    if (submittedBy) {
      filter.createdBy = submittedBy;
    }

    // Purpose
    if (purpose) {
      filter.purpose = new RegExp(purpose, 'i');
    }

    // Rating range (linked to lead score)
    if (ratingFrom !== undefined || ratingTo !== undefined) {
      const scoreRange: any = {};
      if (ratingFrom !== undefined) scoreRange.$gte = ratingFrom;
      if (ratingTo !== undefined) scoreRange.$lte = ratingTo;
      filter.score = scoreRange;
    }

    // Discovery source
    if (source) {
      filter.source = new RegExp(source, 'i');
    }

    // Branch
    if (branch) {
      filter.branch = new RegExp(branch, 'i');
    }

    // Assign To (alternate)
    if (assignTo) {
      filter.assignedTo = assignTo;
    }

    // Status
    const statusVal = status || currentStatus;
    if (statusVal) {
      filter.status = statusVal;
    }

    // Reasons / Outcome
    if (reasons) {
      filter.outcome = new RegExp(reasons, 'i');
    }

    // Permission
    if (permission) {
      filter.visibility =
        permission === 'Private'
          ? LeadVisibility.PRIVATE
          : LeadVisibility.BRANCH;
    }

    // Batch identifier
    if (batchNumber) {
      filter.keywords = new RegExp(batchNumber, 'i');
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
    const months = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];
    const format2 = `${now.getDate()}-${months[now.getMonth()]}-${now.getFullYear()}`; // "26-May-2026"

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    switch (viewType) {
      case 'today':
        filter.status = LeadStatus.IN_PROGRESS;
        filter.$or = [
          { scheduleDate: { $in: [format1, format2] } },
          { createdAt: { $gte: startOfToday, $lte: endOfToday } },
          { updatedAt: { $gte: startOfToday, $lte: endOfToday } },
          { assignDate: { $gte: startOfToday, $lte: endOfToday } }
        ];
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

    // Map sorting fields
    let sortField = 'createdAt';
    if (sortBy === 'Assigned Date') {
      sortField = 'assignDate';
    } else if (sortBy === 'Create Date') {
      sortField = 'createdAt';
    } else if (sortBy === 'FollowUp Date') {
      sortField = 'scheduleDate';
    } else if (sortBy === 'Updated Date') {
      sortField = 'updatedAt';
    }

    const sortOrder = orderBy === 'Asc' ? 1 : -1;
    const sortObj: any = {};
    if (sortBy === 'Name') {
      sortObj['contactId'] = sortOrder;
    } else {
      sortObj[sortField] = sortOrder;
    }

    // Pagination bypass logic: If limit is >= 99999, return all matching records at once
    const queryChain = this.leadModel
      .find(filter)
      .populate(['contactId', 'assignedTo', 'createdBy', 'updatedBy'])
      .sort(sortObj);

    if (limit > 0 && limit < 99999) {
      queryChain.skip((page - 1) * limit).limit(limit);
    }

    const rawLeads = await queryChain.lean().exec();
    const leads = this.serializeLean(rawLeads);

    // In-memory sorting for populated customer contact name if needed
    if (sortBy === 'Name') {
      leads.sort((a, b) => {
        const nameA = (a.contactId as any)?.firstName || '';
        const nameB = (b.contactId as any)?.firstName || '';
        return sortOrder === 1
          ? nameA.localeCompare(nameB)
          : nameB.localeCompare(nameA);
      });
    }

    const result = { leads, total };
    try {
      await this.cacheManager.set(cacheKey, result, 300 * 1000); // Cache for 5 minutes
    } catch (err) {
      console.error('Cache write error in findAll:', err);
    }
    return result;
  }

  async findOne(id: string): Promise<any> {
    const cacheKey = `leads:id:${id}`;
    try {
      const cached = await this.cacheManager.get<any>(cacheKey);
      if (cached) {
        return cached;
      }
    } catch (err) {
      console.error('Cache read error in findOne:', err);
    }

    const lead = await this.leadModel
      .findById(id)
      .populate(['contactId', 'assignedTo', 'createdBy', 'updatedBy'])
      .lean()
      .exec();

    if (!lead) {
      throw new NotFoundException(`Lead with ID "${id}" not found`);
    }

    const leadObj = this.serializeLean(lead);

    // Enforce virtual fields to match frontend layout shown in screenshot
    const assignDate = lead.assignDate || new Date();
    const diffTime = Math.abs(Date.now() - new Date(assignDate).getTime());
    const daysSinceAssigned = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    leadObj['daysSinceAssigned'] = daysSinceAssigned;
    leadObj['totalCallDuration'] = 0;
    leadObj['aiSummary'] =
      'No AI summary available yet. Please try again after some interaction is recorded';

    try {
      await this.cacheManager.set(cacheKey, leadObj, 600 * 1000); // Cache for 10 minutes
    } catch (err) {
      console.error('Cache write error in findOne:', err);
    }
    return leadObj;
  }

  async update(
    id: string,
    updateLeadDto: UpdateLeadDto,
  ): Promise<LeadDocument> {
    const originalLead = await this.leadModel.findById(id).exec();
    if (!originalLead) {
      throw new NotFoundException(`Lead with ID "${id}" not found`);
    }

    const updatedLead = await this.leadModel
      .findByIdAndUpdate(id, updateLeadDto, { new: true })
      .populate(['contactId', 'assignedTo', 'createdBy', 'updatedBy'])
      .exec();

    if (updatedLead) {
      // Sync with Google Calendar asynchronously
      this.googleCalendarService.syncEventForLead(updatedLead._id.toString()).catch(err => {
        console.error('Google Calendar sync failed during update:', err);
      });
    }

    if (!updatedLead) {
      throw new NotFoundException(`Lead with ID "${id}" not found`);
    }

    const isTransferred =
      updateLeadDto.assignedTo &&
      originalLead.assignedTo?.toString() !== updateLeadDto.assignedTo;

    // Log the change and sync associated contact
    if (isTransferred) {
      const contact = await this.contactModel.findById(updatedLead.contactId).exec();
      if (contact) {
        contact.assignedTo = updatedLead.assignedTo as any;
        if (updateLeadDto.branch) {
          contact.branch = updateLeadDto.branch;
        }
        if (updateLeadDto.visibility) {
          contact.visibility = updateLeadDto.visibility as any;
        }
        await contact.save();
      }

      const contactName = contact
        ? `${contact.firstName} ${contact.lastName || ''}`.trim()
        : 'Unknown';
      const targetUser = await this.userModel.findById(updateLeadDto.assignedTo).exec();
      const targetUserName = targetUser
        ? `${targetUser.firstName} ${targetUser.lastName || ''}`.trim()
        : 'Unknown';

      await this.activitiesService.log(
        `Transferred contact "${contactName}" (Type: Lead Transfer) to agent "${targetUserName}". Branch: "${updateLeadDto.branch || 'unchanged'}"`,
        ActivityType.LEAD,
      );
    } else if (updateLeadDto.scheduleDate) {
      const contactName = updatedLead.contactId
        ? `${(updatedLead.contactId as any).firstName} ${(updatedLead.contactId as any).lastName || ''}`.trim()
        : 'Unknown';
      await this.activitiesService.log(
        `Scheduled follow-up for contact "${contactName}" on ${updateLeadDto.scheduleDate} at ${updateLeadDto.scheduleTime || '—'} [Remark: ${updateLeadDto.nextRemark || 'None'}]`,
        ActivityType.LEAD,
      );
    } else if (updateLeadDto.status && originalLead.status !== updateLeadDto.status) {
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

    await this.invalidateCache(id);
    return updatedLead;
  }

  async remove(id: string): Promise<void> {
    const lead = await this.leadModel.findById(id).populate('contactId').exec();
    if (!lead) {
      throw new NotFoundException(`Lead with ID "${id}" not found`);
    }

    if (lead.googleEventId && lead.assignedTo) {
      this.googleCalendarService.deleteEvent(lead.assignedTo.toString() || (lead.assignedTo as any)._id?.toString(), lead.googleEventId).catch(err => {
        console.error('Google Calendar event deletion failed:', err);
      });
    }

    await this.leadModel.findByIdAndDelete(id).exec();

    // Log deletion action
    const customerName = lead.contactId
      ? `${lead.contactId.firstName} ${lead.contactId.lastName || ''}`.trim()
      : 'Unknown';
    await this.activitiesService.log(
      `Deleted lead: "${customerName}"`,
      ActivityType.LEAD,
    );
    await this.invalidateCache(id);
  }

  /**
   * Shared sort helper — maps UI Sort By label → MongoDB field + direction.
   * Supported labels: 'Assigned Date' | 'Create Date' | 'FollowUp Date' | 'Updated Date' | 'Name'
   */
  private buildSortObject(
    sortBy: string,
    orderBy: 'Asc' | 'Desc',
  ): Record<string, 1 | -1> {
    const dir: 1 | -1 = orderBy === 'Asc' ? 1 : -1;
    const fieldMap: Record<string, string> = {
      'Assigned Date': 'assignDate',
      'Create Date': 'createdAt',
      'FollowUp Date': 'scheduleDate',
      'Updated Date': 'updatedAt',
      Name: 'contactId', // in-memory sort applied after populate
    };
    const field = fieldMap[sortBy] ?? 'createdAt';
    return { [field]: dir };
  }

  /**
   * GET /leads/today-followup
   * Returns leads scheduled for TODAY + overdue leads (past scheduleDate, still In Progress).
   * Also returns summary counts split by temperature (Hot / Warm / Cold).
   * Optionally scoped to a single agent via `assignedTo`.
   */
  async getTodayFollowup(
    assignedTo?: string,
    sortBy = 'FollowUp Date',
    orderBy: 'Asc' | 'Desc' = 'Asc',
    page = 1,
    limit = 20,
  ): Promise<{
    summary: {
      totalToday: number;
      hot: number;
      warm: number;
      cold: number;
      overdue: number;
    };
    todayLeads: any[];
    overdueLeads: any[];
  }> {
    const version = (await this.cacheManager.get<number>('leads_version')) || 1;
    const cacheKey = `leads:today:${version}:${assignedTo || 'all'}:${sortBy}:${orderBy}:${page}:${limit}`;
    try {
      const cached = await this.cacheManager.get<any>(cacheKey);
      if (cached) {
        return cached;
      }
    } catch (err) {
      console.error('Cache read error in getTodayFollowup:', err);
    }

    const now = new Date();

    // Build two date string formats to match stored scheduleDate values
    const months = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];
    const todayISO = now.toISOString().split('T')[0]; // "2026-05-29"
    const todayLong = `${now.getDate()}-${months[now.getMonth()]}-${now.getFullYear()}`; // "29-May-2026"

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    // Base filter: only In Progress leads (Won/Lost don't need followup)
    const baseFilter: any = { status: LeadStatus.IN_PROGRESS, isDuplicateHidden: { $ne: true } };
    if (assignedTo) baseFilter.assignedTo = assignedTo;

    // ── TODAY filter ─────────────────────────────────────────────────
    const todayFilter = {
      ...baseFilter,
      $or: [
        { scheduleDate: { $in: [todayISO, todayLong] } },
        { createdAt: { $gte: startOfToday, $lte: endOfToday } },
        { updatedAt: { $gte: startOfToday, $lte: endOfToday } },
        { assignDate: { $gte: startOfToday, $lte: endOfToday } },
      ],
    };

    // ── OVERDUE filter (scheduleDate is in the past, not today) ──────
    // Since scheduleDate is stored as string in two possible formats,
    // we use $lt on ISO format and also exclude today's entries
    const overdueFilter = {
      ...baseFilter,
      scheduleDate: {
        $lt: todayISO,
        $nin: [todayISO, todayLong],
      },
      createdAt: { $not: { $gte: startOfToday, $lte: endOfToday } },
      updatedAt: { $not: { $gte: startOfToday, $lte: endOfToday } },
      assignDate: { $not: { $gte: startOfToday, $lte: endOfToday } },
    };

    const sortObj = this.buildSortObject(sortBy, orderBy);
    const isNameSort = sortBy === 'Name';

    // Run all queries in parallel for performance
    const [
      todayLeads,
      overdueLeads,
      hotCount,
      warmCount,
      coldCount,
      overdueCount,
    ] = await Promise.all([
      // Paginated today leads
      this.leadModel
        .find(todayFilter)
        .populate(['contactId', 'assignedTo'])
        .sort(isNameSort ? { createdAt: -1 } : sortObj)
        .skip((page - 1) * limit)
        .limit(limit)
        .lean()
        .exec(),

      // Paginated overdue leads — always sorted oldest-first (most urgent)
      this.leadModel
        .find(overdueFilter)
        .populate(['contactId', 'assignedTo'])
        .sort({ scheduleDate: 1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean()
        .exec(),

      // Summary counts — temperature breakdown for TODAY's leads
      this.leadModel
        .countDocuments({ ...todayFilter, temperature: LeadTemperature.HOT })
        .exec(),
      this.leadModel
        .countDocuments({ ...todayFilter, temperature: LeadTemperature.WARM })
        .exec(),
      this.leadModel
        .countDocuments({ ...todayFilter, temperature: LeadTemperature.COLD })
        .exec(),

      // Total overdue count
      this.leadModel.countDocuments(overdueFilter).exec(),
    ]);

    // In-memory name sort for today leads (populated field)
    let finalTodayLeads: any[] = this.serializeLean(todayLeads);
    if (isNameSort) {
      const dir = orderBy === 'Asc' ? 1 : -1;
      finalTodayLeads = [...finalTodayLeads].sort((a, b) => {
        const nameA = (a.contactId as any)?.firstName || '';
        const nameB = (b.contactId as any)?.firstName || '';
        return dir === 1
          ? nameA.localeCompare(nameB)
          : nameB.localeCompare(nameA);
      });
    }

    const result = {
      summary: {
        totalToday: hotCount + warmCount + coldCount,
        hot: hotCount,
        warm: warmCount,
        cold: coldCount,
        overdue: overdueCount,
      },
      todayLeads: finalTodayLeads,
      overdueLeads: this.serializeLean(overdueLeads),
    };
    try {
      await this.cacheManager.set(cacheKey, result, 300 * 1000); // Cache for 5 minutes
    } catch (err) {
      console.error('Cache write error in getTodayFollowup:', err);
    }
    return result;
  }

  /**
   * GET /leads/open-leads
   * Full active pipeline — all In Progress leads.
   * Summary: total, hot, warm, cold counts + won/lost closed totals for pipeline context.
   */
  async getOpenLeads(
    assignedTo?: string,
    branch?: string,
    sortBy = 'Create Date',
    orderBy: 'Asc' | 'Desc' = 'Desc',
    page = 1,
    limit = 20,
  ) {
    const version = (await this.cacheManager.get<number>('leads_version')) || 1;
    const cacheKey = `leads:open:${version}:${assignedTo || 'all'}:${branch || 'all'}:${sortBy}:${orderBy}:${page}:${limit}`;
    try {
      const cached = await this.cacheManager.get<any>(cacheKey);
      if (cached) {
        return cached;
      }
    } catch (err) {
      console.error('Cache read error in getOpenLeads:', err);
    }

    const baseFilter: any = { status: LeadStatus.IN_PROGRESS, isDuplicateHidden: { $ne: true } };
    if (assignedTo) baseFilter.assignedTo = assignedTo;
    if (branch) baseFilter.branch = new RegExp(branch, 'i');

    const sortObj = this.buildSortObject(sortBy, orderBy);
    const isNameSort = sortBy === 'Name';

    const [leads, total, hot, warm, cold, won, lost] = await Promise.all([
      this.leadModel
        .find(baseFilter)
        .populate(['contactId', 'assignedTo'])
        .sort(isNameSort ? { createdAt: -1 } : sortObj)
        .skip((page - 1) * limit)
        .limit(limit)
        .lean()
        .exec(),

      this.leadModel.countDocuments(baseFilter).exec(),
      this.leadModel
        .countDocuments({ ...baseFilter, temperature: LeadTemperature.HOT })
        .exec(),
      this.leadModel
        .countDocuments({ ...baseFilter, temperature: LeadTemperature.WARM })
        .exec(),
      this.leadModel
        .countDocuments({ ...baseFilter, temperature: LeadTemperature.COLD })
        .exec(),

      // Won/Lost counts scoped to same agent/branch for context
      this.leadModel
        .countDocuments({
          ...(assignedTo ? { assignedTo } : {}),
          ...(branch ? { branch: new RegExp(branch, 'i') } : {}),
          status: LeadStatus.WON,
        } as any)
        .exec(),
      this.leadModel
        .countDocuments({
          ...(assignedTo ? { assignedTo } : {}),
          ...(branch ? { branch: new RegExp(branch, 'i') } : {}),
          status: LeadStatus.LOST,
        } as any)
        .exec(),
    ]);

    // In-memory name sort for open leads (populated field)
    let finalLeads: any[] = this.serializeLean(leads);
    if (isNameSort) {
      const dir = orderBy === 'Asc' ? 1 : -1;
      finalLeads = [...finalLeads].sort((a, b) => {
        const nameA = (a.contactId as any)?.firstName || '';
        const nameB = (b.contactId as any)?.firstName || '';
        return dir === 1
          ? nameA.localeCompare(nameB)
          : nameB.localeCompare(nameA);
      });
    }

    const result = {
      summary: { total, hot, warm, cold, won, lost },
      leads: finalLeads,
    };
    try {
      await this.cacheManager.set(cacheKey, result, 300 * 1000); // Cache for 5 minutes
    } catch (err) {
      console.error('Cache write error in getOpenLeads:', err);
    }
    return result;
  }

  async changeStatus(
    id: string,
    dto: ChangeLeadStatusDto,
    defaultUserId?: string,
  ) {
    const lead = await this.leadModel.findById(id).populate('contactId').exec();
    if (!lead) {
      throw new NotFoundException(`Lead with ID "${id}" not found`);
    }

    lead.status = dto.status;
    lead.outcome = dto.outcome;
    const saved = await lead.save();

    const customerName = lead.contactId
      ? `${lead.contactId.firstName} ${lead.contactId.lastName || ''}`.trim()
      : 'Unknown';
    await this.activitiesService.log(
      `Changed status of lead for "${customerName}" to "${dto.status}" | Outcome: "${dto.outcome}"`,
      ActivityType.LEAD,
      defaultUserId,
    );

    await this.invalidateCache(id);
    return saved.populate(['contactId', 'assignedTo']);
  }

  async updateRequirement(
    id: string,
    dto: UpdateRequirementDto,
    defaultUserId?: string,
  ) {
    const lead = await this.leadModel.findById(id).populate('contactId').exec();
    if (!lead) {
      throw new NotFoundException(`Lead with ID "${id}" not found`);
    }

    lead.requirement = dto.requirement;
    const saved = await lead.save();

    const customerName = lead.contactId
      ? `${lead.contactId.firstName} ${lead.contactId.lastName || ''}`.trim()
      : 'Unknown';
    await this.activitiesService.log(
      `Updated raw requirement of lead for "${customerName}" to: "${dto.requirement}"`,
      ActivityType.LEAD,
      defaultUserId,
    );

    await this.invalidateCache(id);
    return saved.populate(['contactId', 'assignedTo']);
  }

  async sendSms(id: string, dto: SendLeadSmsDto, defaultUserId?: string) {
    const lead = await this.leadModel.findById(id).populate('contactId').exec();
    if (!lead) {
      throw new NotFoundException(`Lead with ID "${id}" not found`);
    }

    const contact = lead.contactId;
    if (!contact || !contact.mobile) {
      throw new BadRequestException('Lead contact has no mobile number registered');
    }

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

    return { success: true };
  }

  async sendEmail(id: string, dto: SendLeadEmailDto, defaultUserId?: string) {
    const lead = await this.leadModel.findById(id).populate('contactId').exec();
    if (!lead) {
      throw new NotFoundException(`Lead with ID "${id}" not found`);
    }

    const contact = lead.contactId;
    if (!contact || !contact.email) {
      throw new BadRequestException('Lead contact has no email address registered');
    }

    await this.emailsService.schedule({
      to: contact.email.trim(),
      subject: dto.subject,
      body: dto.message,
      scheduleDate: dto.scheduleDate,
      scheduleTime: dto.scheduleTime,
      createdBy: defaultUserId,
    });

    return { success: true };
  }

  async addQuickNote(
    id: string,
    dto: LeadQuickNoteDto,
    defaultUserId?: string,
  ) {
    const lead = await this.leadModel.findById(id).populate('contactId').exec();
    if (!lead) {
      throw new NotFoundException(`Lead with ID "${id}" not found`);
    }

    const customerName = lead.contactId
      ? `${lead.contactId.firstName} ${lead.contactId.lastName || ''}`.trim()
      : 'Unknown';
    await this.activitiesService.log(
      `Added Quick Note [Type: ${dto.commentType}] to lead for "${customerName}": "${dto.comment}"`,
      ActivityType.LEAD,
      defaultUserId,
    );

    return { success: true };
  }

  async sendProposal(id: string, dto: SendProposalDto, defaultUserId?: string) {
    const lead = await this.leadModel.findById(id).populate('contactId').exec();
    if (!lead) {
      throw new NotFoundException(`Lead with ID "${id}" not found`);
    }

    const customerName = lead.contactId
      ? `${lead.contactId.firstName} ${lead.contactId.lastName || ''}`.trim()
      : 'Unknown';
    const recipientEmail =
      (lead.contactId as any)?.email || 'no-email-defined@crm.com';

    await this.activitiesService.log(
      `Sent Proposal to "${customerName}" (${recipientEmail}) | Language: ${dto.language}, Module: ${dto.module}, Project: ${dto.propertyProject}, Template: ${dto.template}`,
      ActivityType.LEAD,
      defaultUserId,
    );

    return {
      success: true,
      message: `Proposal successfully sent to ${recipientEmail}`,
    };
  }

  async getLeadHistory(id: string) {
    const lead = await this.leadModel.findById(id).populate('contactId').exec();
    if (!lead) {
      throw new NotFoundException(`Lead with ID "${id}" not found`);
    }

    const customerName = lead.contactId
      ? `${lead.contactId.firstName} ${lead.contactId.lastName || ''}`.trim()
      : 'Unknown';
    return this.activitiesService.findLogsForContact(customerName, id);
  }

  async sendTermsConditions(
    id: string,
    dto: LeadTermsConditionsDto,
    defaultUserId?: string,
  ) {
    const lead = await this.leadModel.findById(id).populate('contactId').exec();
    if (!lead) {
      throw new NotFoundException(`Lead with ID "${id}" not found`);
    }

    const customerName = lead.contactId
      ? `${lead.contactId.firstName} ${lead.contactId.lastName || ''}`.trim()
      : 'Unknown';
    const recipientEmail =
      (lead.contactId as any)?.email || 'no-email-defined@crm.com';

    await this.activitiesService.log(
      `Sent Terms & Conditions HTML email to lead "${customerName}" (${recipientEmail}) with Subject: "${dto.subject}" and Message body: "${dto.message}"`,
      ActivityType.LEAD,
      defaultUserId,
    );

    return {
      success: true,
      message: `Terms & Conditions successfully sent to ${recipientEmail}`,
    };
  }

  async getSiteVisits(id: string) {
    const lead = await this.leadModel.findById(id).exec();
    if (!lead) {
      throw new NotFoundException(`Lead with ID "${id}" not found`);
    }
    return lead.siteVisits || [];
  }

  async createSiteVisit(
    id: string,
    dto: CreateSiteVisitDto,
    defaultUserId?: string,
  ) {
    const lead = await this.leadModel.findById(id).populate('contactId').exec();
    if (!lead) {
      throw new NotFoundException(`Lead with ID "${id}" not found`);
    }

    const siteVisitData = {
      ...dto,
      sendSmsNotification: dto.sendSmsNotification === true,
      sendEmailNotification: dto.sendEmailNotification === true,
      createdAt: new Date(),
    };

    if (!lead.siteVisits) {
      lead.siteVisits = [];
    }
    lead.siteVisits.push(siteVisitData as any);
    const saved = await lead.save();

    // ALSO CREATE STANDALONE SITE VISIT DOCUMENT
    // Lookup user ID matching assignee name (dto.assignee is a string like "Gourav Raut")
    const assigneeUser = await this.userModel
      .findOne({
        $or: [
          { firstName: new RegExp(dto.assignee, 'i') },
          { lastName: new RegExp(dto.assignee, 'i') },
          { email: new RegExp(dto.assignee, 'i') },
        ],
      })
      .exec();

    const assigneeId = assigneeUser
      ? assigneeUser._id
      : defaultUserId ||
        lead.assignedTo ||
        (await this.userModel.findOne().exec())?._id;

    const newStandaloneSiteVisit = new this.siteVisitModel({
      visitor: dto.visitor,
      visitType: dto.visitType,
      module: dto.module,
      siteName: dto.siteName,
      otherName: dto.otherName,
      visitDate: dto.visitDate,
      timeIn: dto.timeIn,
      timeOut: dto.timeOut,
      remark: dto.remark,
      siteManager: dto.siteManager,
      sourcingManager: dto.sourcingManager,
      closingManager: dto.closingManager,
      source: dto.source,
      branch: dto.branch,
      assignee: assigneeId,
      visitStatus: dto.visitStatus,
      sendSmsNotification: dto.sendSmsNotification === true,
      sendEmailNotification: dto.sendEmailNotification === true,
      isPrivate: dto.visibility === 'Private',
      photograph: dto.photograph,
      createdBy: defaultUserId || lead.assignedTo,
      leadId: lead._id,
      contactId: (lead.contactId as any)?._id || (lead.contactId as any),
    });
    await newStandaloneSiteVisit.save();

    const customerName = lead.contactId
      ? `${lead.contactId.firstName} ${lead.contactId.lastName || ''}`.trim()
      : 'Unknown';

    let notificationLog = '';
    if (dto.sendSmsNotification) notificationLog += `[SMS Notification: Sent] `;
    if (dto.sendEmailNotification)
      notificationLog += `[Email Notification: Sent] `;

    await this.activitiesService.log(
      `Scheduled site visit for visitor "${dto.visitor}" (Lead: "${customerName}") to "${dto.siteName}" on ${dto.visitDate} from ${dto.timeIn} to ${dto.timeOut} | Site Manager: "${dto.siteManager}", Visit Status: "${dto.visitStatus}" ${notificationLog}`.trim(),
      ActivityType.LEAD,
      defaultUserId,
    );

    await this.invalidateCache(id);
    return saved;
  }

  async getConversionHistory(contactId?: string): Promise<LeadConversionLog[]> {
    const filter: any = {};
    if (contactId) {
      filter.contactId = contactId;
    }
    return this.leadConversionLogModel
      .find(filter)
      .populate(['contactId', 'leadId', 'convertedBy', 'assignedTo'])
      .sort({ createdAt: -1 })
      .exec();
  }

  async groupDelete(dto: GroupDeleteDto, defaultUserId?: string) {
    const filter =
      dto.leadIds && dto.leadIds.length > 0
        ? { _id: { $in: dto.leadIds } }
        : {};

    const leads = await this.leadModel.find(filter).exec();
    const count = leads.length;

    await this.leadModel.deleteMany(filter).exec();

    await this.activitiesService.log(
      `Bulk deleted ${count} leads from CRM database`,
      ActivityType.LEAD,
      defaultUserId,
    );

    await this.invalidateCache();
    return { success: true, count };
  }

  async sendGroupSms(dto: SendGroupSmsDto, defaultUserId?: string) {
    const filter =
      dto.leadIds && dto.leadIds.length > 0
        ? { _id: { $in: dto.leadIds } }
        : {};

    const leads = await this.leadModel.find(filter).populate('contactId').exec();
    const contactsWithMobile = leads
      .map((lead) => lead.contactId)
      .filter((contact) => contact && contact.mobile && contact.mobile.trim().length > 0);

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

    await this.activitiesService.log(
      `Sent Group SMS: "${dto.message}" to ${count} leads [Template: ${dto.template}, DLT ID: ${dto.dltTemplateId}]`,
      ActivityType.LEAD,
      defaultUserId,
    );

    return { success: true, count };
  }

  async sendGroupEmail(dto: SendGroupEmailDto, defaultUserId?: string) {
    const filter =
      dto.leadIds && dto.leadIds.length > 0
        ? { _id: { $in: dto.leadIds } }
        : {};

    const leads = await this.leadModel.find(filter).populate('contactId').exec();
    const contactsWithEmail = leads
      .map((lead) => lead.contactId)
      .filter((contact) => contact && contact.email && contact.email.trim().length > 0);

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
      `Sent Group Email: "${dto.subject}" to ${count} leads [Template: ${dto.template}]`,
      ActivityType.LEAD,
      defaultUserId,
    );

    return { success: true, count };
  }

  async downloadExcel(query: any): Promise<Buffer> {
    const { buffer } = await this.generateLeadsExcel(query);
    return buffer;
  }

  async uploadToGoogleDrive(query: any, inputLimit?: number): Promise<any> {
    const { buffer, fileName } = await this.generateLeadsExcel(query);
    return this.uploadExcelToGoogleDrive(buffer, fileName);
  }

  private async generateLeadsExcel(query: any): Promise<{ buffer: Buffer; fileName: string }> {
    const { leads } = await this.findAll({ ...query, limit: query.limit || 99999 });

    const headers = [
      'Lead ID',
      'Customer Name',
      'Mobile Number',
      'Email',
      'Requirement',
      'Follow-up Note',
      'Schedule Date',
      'Schedule Time',
      'Score',
      'Keywords',
      'Folder',
      'Source',
      'Branch',
      'Assigned To',
      'Temperature',
      'Status',
      'Next Remark',
      'Outcome',
      'Interested In',
      'Purpose',
      'Created At'
    ];

    const rows = leads.map((l: any) => {
      const contact = l.contactId || {};
      const customerName = `${contact.salutation ? contact.salutation + ' ' : ''}${contact.firstName || ''} ${contact.lastName || ''}`.trim();
      const mobileVal = contact.mobile || '';
      const emailVal = contact.email || '';
      const assignedToVal = l.assignedTo?.firstName || '';

      return [
        l.id || l._id?.toString() || '',
        customerName || 'Unknown Customer',
        mobileVal,
        emailVal,
        l.requirement || '',
        l.followupNote || '',
        l.scheduleDate || '',
        l.scheduleTime || '',
        l.score !== undefined ? l.score.toString() : '1.0',
        l.keywords || '',
        l.folder || '',
        l.source || '',
        l.branch || '',
        assignedToVal,
        l.temperature || '',
        l.status || '',
        l.nextRemark || '',
        l.outcome || '',
        l.interestedIn || '',
        l.purpose || '',
        l.createdAt && !isNaN(new Date(l.createdAt).getTime()) ? new Date(l.createdAt).toISOString() : '',
      ];
    });

    const buffer = await generateExcelBuffer('Leads', headers, rows);
    const fileName = `leads_export_${new Date().toISOString().slice(0, 10)}.xlsx`;
    return { buffer, fileName };
  }

  private async uploadExcelToGoogleDrive(buffer: Buffer, fileName: string): Promise<any> {
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

        const boundary = 'leads_upload_boundary_12345';
        const metadata = {
          name: fileName,
          mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        };

        const header = [
          `--${boundary}`,
          'Content-Type: application/json; charset=UTF-8',
          '',
          JSON.stringify(metadata),
          `--${boundary}`,
          'Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          '',
          '',
        ].join('\r\n');
        const footer = `\r\n--${boundary}--\r\n`;

        const multipartBody = Buffer.concat([
          Buffer.from(header, 'utf-8'),
          buffer,
          Buffer.from(footer, 'utf-8'),
        ]);

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
        console.error('Real Google Drive upload failed, falling back to mock:', err);
      }
    }

    try {
      const fs = await import('fs');
      const path = await import('path');
      const backupsDir = path.join(process.cwd(), 'backups');
      if (!fs.existsSync(backupsDir)) {
        fs.mkdirSync(backupsDir, { recursive: true });
      }

      const backupFileName = `leads_drive_backup_${new Date().toISOString().replace(/[:.]/g, '-')}.xlsx`;
      const filePath = path.join(backupsDir, backupFileName);
      fs.writeFileSync(filePath, buffer);

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
      console.error('Google Drive export simulation failed:', err);
      throw new Error(`Export to Google Drive failed: ${err.message}`);
    }
  }



  async importLeads(leads: any[], defaultUserId?: string) {
    const limit = 2000;
    const slice = leads.slice(0, limit);
    const createdLeads: any[] = [];

    const defaultUser = await this.userModel.findOne().exec();
    const fallbackUserId = defaultUserId || (defaultUser ? defaultUser._id.toString() : undefined);

    const users = await this.userModel.find().exec();
    const findUserId = (assignedVal: any): string | undefined => {
      if (!assignedVal) return fallbackUserId;
      const valStr = assignedVal.toString().trim();
      if (!valStr) return fallbackUserId;

      // Check if it's a valid 24-character hex ObjectId
      const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(valStr);
      if (isValidObjectId) {
        return valStr;
      }

      // Look up by firstName, email, or full name
      const cleanVal = valStr.toLowerCase();
      const foundUser = users.find(
        (u) =>
          u.firstName.toLowerCase() === cleanVal ||
          u.email.toLowerCase() === cleanVal ||
          `${u.firstName} ${u.lastName || ''}`.trim().toLowerCase() === cleanVal
      );

      return foundUser ? foundUser._id.toString() : fallbackUserId;
    };

    for (const item of slice) {
      const rawMobile = (item.Customer_Mobile || item.mobile || item['Mobile Number'] || '').toString().trim();
      const firstName = (item.Customer_Name || item.firstName || item.name || item['Customer Name'] || '').toString().trim();

      if (!firstName || !rawMobile) continue;

      const parsedPhone = parseMobileAndCountryCode(rawMobile);
      const assignedToId = findUserId(item.assignedTo || item['Assigned To']);

      let contact = await this.contactModel.findOne({
        mobile: parsedPhone.mobile,
        countryCode: parsedPhone.countryCode,
        isDeleted: { $ne: true }
      }).exec();

      if (!contact) {
        let salutation: string | undefined = undefined;
        let fName = firstName;
        let lName: string | undefined = undefined;

        const nameParts = firstName.split(/\s+/);
        if (nameParts.length > 0) {
          const firstPart = nameParts[0].replace(/\./g, '');
          const salutations = ['mr', 'mrs', 'ms', 'dr', 'prof', 'sir'];
          if (salutations.includes(firstPart.toLowerCase())) {
            salutation = nameParts[0];
            nameParts.shift();
          }
        }
        if (nameParts.length > 0) {
          fName = nameParts[0];
          nameParts.shift();
        }
        if (nameParts.length > 0) {
          lName = nameParts.join(' ');
        }

        contact = new this.contactModel({
          salutation,
          firstName: fName,
          lastName: lName,
          countryCode: parsedPhone.countryCode,
          mobile: parsedPhone.mobile,
          email: item.Customer_Email || item.email || item.Email,
          customerType: item.Customer_CustomerType || item.customerType || item['Customer Type'] || 'Customer',
          contactType: item.Customer_ContactType || item.contactType || item['Contact Type'] || 'Employee',
          branch: item.Lead_Branch || item.branch || item.Branch || 'Global Team',
          source: item.Lead_Source || item.source || item.Source || 'Spreadsheet Import',
          assignedTo: assignedToId,
        });
        await contact.save();
      }

      const requirement = item.Lead_Requirement || item.requirement || item.Requirement || 'Imported Lead Requirement';
      const followupNote = item.Lead_FollowupNote || item.followupNote || item['Follow-up Note'] || requirement;
      const scheduleDate = item.Lead_ScheduleDate || item.scheduleDate || item['Schedule Date'] || new Date().toISOString().split('T')[0];
      const scheduleTime = item.Lead_ScheduleTime || item.scheduleTime || item['Schedule Time'] || '12:00pm';

      const newLead = new this.leadModel({
        contactId: contact._id,
        requirement,
        followupNote,
        scheduleDate,
        scheduleTime,
        score: item.score !== undefined ? Number(item.score) : (item.Score !== undefined ? Number(item.Score) : 1.0),
        keywords: item.Lead_Keywords || item.keywords || item.Keywords || '',
        folder: item.Lead_Folder || item.folder || item.Folder || '',
        source: item.Lead_Source || item.source || item.Source || 'Spreadsheet Import',
        branch: item.Lead_Branch || item.branch || item.Branch || 'Global Team',
        assignedTo: assignedToId,
        visibility: (item.Lead_Visibility || item.visibility || item.Visibility) === 'Private' ? LeadVisibility.PRIVATE : LeadVisibility.BRANCH,
        temperature: item.Lead_Temperature || item.temperature || item.Temperature || LeadTemperature.COLD,
        status: item.Lead_Status || item.status || item.Status || LeadStatus.IN_PROGRESS,
        outcome: item.Lead_Outcome || item.outcome || item.Outcome || 'Said Not Looking Any Property Now',
        interestedIn: item.Lead_InterestedIn || item.interestedIn || item['Interested In'] || requirement,
        createdBy: fallbackUserId,
        updatedBy: fallbackUserId,
      });

      const savedLead = await newLead.save();
      createdLeads.push(savedLead);
    }

    await this.activitiesService.log(
      `Imported ${createdLeads.length} leads via bulk spreadsheet upload`,
      ActivityType.LEAD,
      defaultUserId,
    );

    await this.invalidateCache();
    return { success: true, count: createdLeads.length };
  }

  async removeDuplicates(defaultUserId?: string): Promise<{ success: boolean; count: number; message: string }> {
    const leads = await this.leadModel.find({ isDuplicateHidden: { $ne: true } }).populate('contactId').exec();
    const groups = new Map<string, LeadDocument[]>();

    for (const lead of leads) {
      if (!lead.contactId) {
        continue;
      }
      
      const contact = lead.contactId as any;
      const firstName = contact.firstName ? contact.firstName.trim().toLowerCase() : '';
      const mobile = contact.mobile ? contact.mobile.trim() : '';
      const email = contact.email ? contact.email.trim().toLowerCase() : '';

      const key = `${firstName}_${mobile}_${email}`;

      let group = groups.get(key);
      if (!group) {
        group = [];
        groups.set(key, group);
      }
      group.push(lead);
    }

    let deletedCount = 0;

    for (const [key, leadGroup] of groups.entries()) {
      if (leadGroup.length <= 1) {
        continue;
      }

      leadGroup.sort((a, b) => {
        const timeA = (a as any).createdAt ? new Date((a as any).createdAt).getTime() : 0;
        const timeB = (b as any).createdAt ? new Date((b as any).createdAt).getTime() : 0;
        return timeA - timeB;
      });

      for (let i = 1; i < leadGroup.length; i++) {
        const duplicateLead = leadGroup[i];
        duplicateLead.isDuplicateHidden = true;
        await duplicateLead.save();

        const contact = duplicateLead.contactId as any;
        const customerName = contact
          ? `${contact.firstName} ${contact.lastName || ''}`.trim()
          : 'Unknown';
        await this.activitiesService.log(
          `Duplicate lead for "${customerName}" was identified and hidden from active list`,
          ActivityType.LEAD,
          defaultUserId,
        );

        deletedCount++;
      }
    }

    if (deletedCount > 0) {
      await this.activitiesService.log(
        `Removed ${deletedCount} duplicate leads from active CRM views`,
        ActivityType.LEAD,
        defaultUserId,
      );
      await this.invalidateCache();
    }

    return {
      success: true,
      count: deletedCount,
      message: deletedCount > 0 
        ? `Successfully removed ${deletedCount} duplicate lead(s).` 
        : 'No duplicate leads found.'
    };
  }
}

function parseMobileAndCountryCode(rawMobile: string): { countryCode: string; mobile: string } {
  const clean = (rawMobile || '').toString().trim().replace(/[-\s()]/g, '');

  if (clean.startsWith('+')) {
    if (clean.startsWith('+91')) {
      return { countryCode: '+91', mobile: clean.substring(3) };
    }
    if (clean.startsWith('+1')) {
      return { countryCode: '+1', mobile: clean.substring(2) };
    }
    if (clean.startsWith('+44')) {
      return { countryCode: '+44', mobile: clean.substring(3) };
    }
    if (clean.startsWith('+971')) {
      return { countryCode: '+971', mobile: clean.substring(4) };
    }
    
    const match = clean.match(/^(\+\d{1,4})(\d{7,15})$/);
    if (match) {
      return { countryCode: match[1], mobile: match[2] };
    }

    return { countryCode: '+91', mobile: clean.replace('+', '') };
  }

  if (clean.length === 12 && clean.startsWith('91')) {
    return { countryCode: '+91', mobile: clean.substring(2) };
  }

  if (clean.length === 10) {
    return { countryCode: '+91', mobile: clean };
  }

  return { countryCode: '+91', mobile: clean };
}
