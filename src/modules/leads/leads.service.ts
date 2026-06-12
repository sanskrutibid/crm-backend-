import {
  Injectable,
  NotFoundException,
  OnModuleInit,
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
} from './dto/lead-actions.dto';
import { ActivitiesService } from '../activities/activities.service';
import { ActivityType } from '../activities/schemas/activity.schema';

@Injectable()
export class LeadsService implements OnModuleInit {
  constructor(
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    @InjectModel(Lead.name) private readonly leadModel: Model<LeadDocument>,
    @InjectModel(Contact.name)
    private readonly contactModel: Model<ContactDocument>,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(SiteVisit.name)
    private readonly siteVisitModel: Model<SiteVisitDocument>,
    private readonly activitiesService: ActivitiesService,
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

  /**
   * Seed Chirag Ashtankar's lead profile linked to Dayamati's contact profile on boot if collection is empty.
   */
  async onModuleInit() {
    const leadCount = await this.leadModel.countDocuments().exec();
    if (leadCount === 0) {
      const defaultUser = await this.userModel.findOne().exec();
      const defaultContact = await this.contactModel
        .findOne({ firstName: 'Dayamati' })
        .exec();

      if (defaultUser && defaultContact) {
        const seedLead: Partial<Lead> = {
          contactId: defaultContact._id as any,
          requirement:
            'Y88006356 Rs. 1.38 Crore, 3 Bed, for Sale in Riddhi Siddhi, Pande Layout , for',
          followupNote: 'Followup on flat details and pricing terms',
          scheduleDate: '2026-06-19', // 19-Jun-2026 YYYY-MM-DD
          scheduleTime: '12:39pm',
          score: 4.5,
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
          interestedIn:
            'Rs. 1.38 Crore, 3 Bed, for Sale in Riddhi Siddhi, Pande Layout',
          purpose: 'Follow-Up Scheduled',
          assignDate: new Date(),
          createdBy: defaultUser._id as any,
          updatedBy: defaultUser._id as any,
        };
        await this.leadModel.create(seedLead);
        console.log(
          '🌱 Successfully seeded initial CRM Leads database collection.',
        );
      } else {
        console.log(
          '⚠️ No users or contacts found in database to assign seed Lead to. Seeding skipped.',
        );
      }
    }
  }

  async create(
    createLeadDto: CreateLeadDto,
    defaultUserId?: string,
  ): Promise<LeadDocument> {
    const assignedTo = createLeadDto.assignedTo || defaultUserId;

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

      const newContact = new this.contactModel({
        salutation,
        firstName,
        lastName,
        customerType: 'Customer',
        contactType: 'Employee',
        mobile: createLeadDto.mobile,
        email: createLeadDto.email
          ? createLeadDto.email.toLowerCase().trim()
          : undefined,
        companyName: createLeadDto.company,
        source: createLeadDto.source || 'Website Form',
        branch: createLeadDto.branch || 'Global Team',
        assignedTo: assignedTo,
      });

      const savedContact = await newContact.save();
      targetContactId = savedContact._id.toString();

      await this.activitiesService.log(
        `Created new contact "${createLeadDto.name}" on-the-fly during lead creation`,
        ActivityType.LEAD,
        defaultUserId,
      );
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

    const leads = await queryChain.exec();

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
      .exec();

    if (!lead) {
      throw new NotFoundException(`Lead with ID "${id}" not found`);
    }

    const leadObj = lead.toJSON();

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

    await this.invalidateCache(id);
    return updatedLead;
  }

  async remove(id: string): Promise<void> {
    const lead = await this.leadModel.findById(id).populate('contactId').exec();
    if (!lead) {
      throw new NotFoundException(`Lead with ID "${id}" not found`);
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

    // Base filter: only In Progress leads (Won/Lost don't need followup)
    const baseFilter: any = { status: LeadStatus.IN_PROGRESS };
    if (assignedTo) baseFilter.assignedTo = assignedTo;

    // ── TODAY filter ─────────────────────────────────────────────────
    const todayFilter = {
      ...baseFilter,
      scheduleDate: { $in: [todayISO, todayLong] },
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
        .exec(),

      // Paginated overdue leads — always sorted oldest-first (most urgent)
      this.leadModel
        .find(overdueFilter)
        .populate(['contactId', 'assignedTo'])
        .sort({ scheduleDate: 1 })
        .skip((page - 1) * limit)
        .limit(limit)
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
    let finalTodayLeads: any[] = todayLeads;
    if (isNameSort) {
      const dir = orderBy === 'Asc' ? 1 : -1;
      finalTodayLeads = [...todayLeads].sort((a, b) => {
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
      overdueLeads,
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

    const baseFilter: any = { status: LeadStatus.IN_PROGRESS };
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
    let finalLeads: any[] = leads;
    if (isNameSort) {
      const dir = orderBy === 'Asc' ? 1 : -1;
      finalLeads = [...leads].sort((a, b) => {
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

    const customerName = lead.contactId
      ? `${lead.contactId.firstName} ${lead.contactId.lastName || ''}`.trim()
      : 'Unknown';
    const mobile = lead.contactId ? lead.contactId.mobile : 'unknown mobile';

    await this.activitiesService.log(
      `Sent SMS to lead "${customerName}" (${mobile}) [Template: ${dto.template}, DLT ID: ${dto.dltTemplateId}]: "${dto.message}" (Scheduled: ${dto.scheduleDate} at ${dto.scheduleTime})`,
      ActivityType.LEAD,
      defaultUserId,
    );

    return { success: true };
  }

  async sendEmail(id: string, dto: SendLeadEmailDto, defaultUserId?: string) {
    const lead = await this.leadModel.findById(id).populate('contactId').exec();
    if (!lead) {
      throw new NotFoundException(`Lead with ID "${id}" not found`);
    }

    const customerName = lead.contactId
      ? `${lead.contactId.firstName} ${lead.contactId.lastName || ''}`.trim()
      : 'Unknown';

    await this.activitiesService.log(
      `Sent Email to lead "${customerName}" (${dto.to}) with Subject: "${dto.subject}" [Template: ${dto.template}, CC: ${dto.cc || 'None'}, BCC: ${dto.bcc || 'None'}] (Scheduled: ${dto.scheduleDate} at ${dto.scheduleTime})`,
      ActivityType.LEAD,
      defaultUserId,
    );

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
}
