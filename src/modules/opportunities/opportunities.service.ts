import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  Opportunity,
  OpportunityDocument,
  OpportunityStatus,
  OpportunityPurpose,
  OpportunityVisibility,
} from './schemas/opportunity.schema';
import { Contact, ContactDocument } from '../contacts/schemas/contact.schema';
import { User, UserDocument } from '../users/schemas/user.schema';
import { CreateOpportunityDto } from './dto/create-opportunity.dto';
import { UpdateOpportunityDto } from './dto/update-opportunity.dto';
import { QueryOpportunityDto } from './dto/query-opportunity.dto';
import { ActivitiesService } from '../activities/activities.service';
import { ActivityType } from '../activities/schemas/activity.schema';
import { SmsService } from '../sms/sms.service';
import { EmailsService } from '../emails/emails.service';
import {
  SendLeadSmsDto,
  SendLeadEmailDto,
  LeadQuickNoteDto,
  SendProposalDto,
  ChangeLeadStatusDto,
  UpdateRequirementDto,
} from '../leads/dto/lead-actions.dto';

@Injectable()
export class OpportunitiesService {
  constructor(
    @InjectModel(Opportunity.name)
    private readonly opportunityModel: Model<OpportunityDocument>,
    @InjectModel(Contact.name)
    private readonly contactModel: Model<ContactDocument>,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    private readonly activitiesService: ActivitiesService,
    private readonly smsService: SmsService,
    private readonly emailsService: EmailsService,
  ) {}

  /**
   * Creates a new Opportunity in the CRM, supporting on-the-fly contact creation if requested.
   */
  async create(
    createOpportunityDto: CreateOpportunityDto,
    defaultUserId?: string,
  ): Promise<OpportunityDocument> {
    const assignedTo = createOpportunityDto.assignedTo || defaultUserId;
    let targetContactId = createOpportunityDto.contactId;

    // 1. Handle on-the-fly Contact creation if requested
    if (createOpportunityDto.addNewContact) {
      if (!createOpportunityDto.name || !createOpportunityDto.mobile) {
        throw new BadRequestException(
          'Name and Mobile are required to create a new contact on-the-fly',
        );
      }

      // Parse salutation, firstName, lastName from name string
      let salutation: string | undefined = undefined;
      let firstName = 'Unknown';
      let lastName: string | undefined = undefined;

      const nameParts = (createOpportunityDto.name || '').trim().split(/\s+/);
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

      const parsedPhone = parseMobileAndCountryCode(createOpportunityDto.mobile);

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
          email: createOpportunityDto.email
            ? createOpportunityDto.email.toLowerCase().trim()
            : undefined,
          companyName: createOpportunityDto.company,
          source: createOpportunityDto.source || 'Website',
          branch: createOpportunityDto.branch || 'Global Team',
          assignedTo: assignedTo,
        });

        targetContact = await newContact.save();

        await this.activitiesService.log(
          `Created new contact "${createOpportunityDto.name}" on-the-fly during opportunity creation`,
          ActivityType.OPPORTUNITY,
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

      // Verify the contact exists
      const contactExists = await this.contactModel
        .findById(targetContactId)
        .exec();
      if (!contactExists) {
        throw new NotFoundException(
          `Contact with ID ${targetContactId} not found`,
        );
      }
    }

    // 2. Fetch target contact for descriptive activity log details
    const targetContact = await this.contactModel
      .findById(targetContactId)
      .exec();
    const contactDisplayName = targetContact
      ? `${targetContact.firstName} ${targetContact.lastName || ''}`.trim()
      : 'Unknown Customer';

    // 3. Create and Save the Opportunity
    const newOpportunity = new this.opportunityModel({
      ...createOpportunityDto,
      contactId: targetContactId,
      assignedTo: assignedTo,
      createdBy: defaultUserId,
      updatedBy: defaultUserId,
      status: createOpportunityDto.status || OpportunityStatus.IN_PROGRESS,
    });

    const savedOpportunity = await newOpportunity.save();

    // 4. Log creation activity in general system logs
    await this.activitiesService.log(
      `Created new opportunity for customer "${contactDisplayName}" (Purpose: ${createOpportunityDto.purpose}, Looking For: ${createOpportunityDto.lookingFor}, Budget: ${createOpportunityDto.minBudget}-${createOpportunityDto.maxBudget} ${createOpportunityDto.budgetUnit})`,
      ActivityType.OPPORTUNITY,
      defaultUserId,
    );

    // 5. Populate and return complete object
    return savedOpportunity.populate([
      'contactId',
      'assignedTo',
      'createdBy',
      'updatedBy',
    ]);
  }

  /**
   * Retrieves specific opportunities assigned to or created by a user.
   */
  async getMyOpportunities(
    sortBy = 'Create Date',
    orderBy: 'Asc' | 'Desc' = 'Desc',
    page = 1,
    limit = 20,
    userId?: string | null,
  ): Promise<{
    totalRecords: number;
    opportunities: OpportunityDocument[];
  }> {
    const isNameSort = sortBy === 'Name';
    const sortObj = this.buildSortObject(sortBy, orderBy);

    const filter: any = {
      $or: [{ assignedTo: userId }, { createdBy: userId }],
    };

    const totalRecords = await this.opportunityModel
      .countDocuments(filter)
      .exec();

    const opportunities = await this.opportunityModel
      .find(filter)
      .populate(['contactId', 'assignedTo', 'createdBy', 'updatedBy'])
      .sort(isNameSort ? { createdAt: -1 } : sortObj)
      .skip((page - 1) * limit)
      .limit(limit)
      .exec();

    let finalOpportunities = opportunities;
    if (isNameSort) {
      const dir = orderBy === 'Asc' ? 1 : -1;
      finalOpportunities = [...opportunities].sort((a, b) => {
        const nameA = (a.contactId as any)?.firstName || '';
        const nameB = (b.contactId as any)?.firstName || '';
        return nameA.localeCompare(nameB) * dir;
      });
    }

    return {
      totalRecords,
      opportunities: finalOpportunities,
    };
  }

  /**
   * Dynamic search, filter, and pagination system matching the Lead module symmetry.
   */
  async findAll(
    query: QueryOpportunityDto,
  ): Promise<{ opportunities: OpportunityDocument[]; total: number }> {
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
      source,
      branch,
      status,
      permission,
      page = 1,
      limit = 10,
    } = query;

    const filter: any = {};

    if ((query as any).opportunityIds) {
      const ids = Array.isArray((query as any).opportunityIds)
        ? (query as any).opportunityIds
        : (query as any).opportunityIds.split(',').map((id: any) => id.trim()).filter(Boolean);
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
        .exec();

      const contactIds = matchedContacts.map((c) => c._id);

      filter.$or = [
        { contactId: { $in: contactIds } },
        { locality: new RegExp(search, 'i') },
        { city: new RegExp(search, 'i') },
        { keyword: new RegExp(search, 'i') },
        { description: new RegExp(search, 'i') },
        { source: new RegExp(search, 'i') },
        { branch: new RegExp(search, 'i') },
        { schedulePurpose: new RegExp(search, 'i') },
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

    // Date ranges (FollowUp / Schedule Date)
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

    if (submittedBy) {
      filter.createdBy = submittedBy;
    }

    if (city) {
      filter.city = new RegExp(city, 'i');
    }

    if (location) {
      filter.locality = new RegExp(location, 'i');
    }

    if (purpose) {
      filter.purpose = purpose;
    }

    if (source) {
      filter.source = new RegExp(source, 'i');
    }

    if (branch) {
      filter.branch = new RegExp(branch, 'i');
    }

    if (status) {
      filter.status = status;
    }

    if (permission) {
      filter.visibility =
        permission === 'Private'
          ? OpportunityVisibility.PRIVATE
          : OpportunityVisibility.BRANCH;
    }

    if (assignedTo) {
      filter.assignedTo = assignedTo;
    }

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
        filter.status = OpportunityStatus.IN_PROGRESS;
        filter.scheduleDate = { $in: [format1, format2] };
        break;
      case 'open':
      case 'pending':
        filter.status = OpportunityStatus.IN_PROGRESS;
        break;
      case 'backlog':
        // Outstanding follow-up in the past
        filter.status = OpportunityStatus.IN_PROGRESS;
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

    const total = await this.opportunityModel.countDocuments(filter).exec();

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
    const queryChain = this.opportunityModel
      .find(filter)
      .populate(['contactId', 'assignedTo', 'createdBy', 'updatedBy'])
      .sort(sortObj);

    if (limit > 0 && limit < 99999) {
      queryChain.skip((page - 1) * limit).limit(limit);
    }

    const opportunities = await queryChain.exec();

    // In-memory sorting for populated customer contact name if needed
    if (sortBy === 'Name') {
      const dir = orderBy === 'Asc' ? 1 : -1;
      opportunities.sort((a, b) => {
        const nameA = (a.contactId as any)?.firstName || '';
        const nameB = (b.contactId as any)?.firstName || '';
        return nameA.localeCompare(nameB) * dir;
      });
    }

    return { opportunities, total };
  }

  /**
   * Retrieves today's follow-up opportunities, split into on-time and overdue.
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
      buy: number;
      rentLease: number;
      other: number;
      overdue: number;
    };
    todayOpportunities: any[];
    overdueOpportunities: any[];
  }> {
    const now = new Date();
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

    const baseFilter: any = { status: OpportunityStatus.IN_PROGRESS };
    if (assignedTo) baseFilter.assignedTo = assignedTo;

    // TODAY filter
    const todayFilter = {
      ...baseFilter,
      scheduleDate: { $in: [todayISO, todayLong] },
    };

    // OVERDUE filter (scheduleDate in the past, not today)
    const overdueFilter = {
      ...baseFilter,
      scheduleDate: {
        $lt: todayISO,
        $nin: [todayISO, todayLong],
      },
    };

    const sortObj = this.buildSortObject(sortBy, orderBy);
    const isNameSort = sortBy === 'Name';

    const [
      todayOpps,
      overdueOpps,
      buyCount,
      rentLeaseCount,
      otherCount,
      overdueCount,
    ] = await Promise.all([
      this.opportunityModel
        .find(todayFilter)
        .populate(['contactId', 'assignedTo'])
        .sort(isNameSort ? { createdAt: -1 } : sortObj)
        .skip((page - 1) * limit)
        .limit(limit)
        .exec(),

      this.opportunityModel
        .find(overdueFilter)
        .populate(['contactId', 'assignedTo'])
        .sort({ scheduleDate: 1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .exec(),

      this.opportunityModel
        .countDocuments({ ...todayFilter, purpose: OpportunityPurpose.BUY })
        .exec(),
      this.opportunityModel
        .countDocuments({
          ...todayFilter,
          purpose: OpportunityPurpose.RENT_LEASE,
        })
        .exec(),
      this.opportunityModel
        .countDocuments({
          ...todayFilter,
          purpose: {
            $nin: [OpportunityPurpose.BUY, OpportunityPurpose.RENT_LEASE],
          },
        })
        .exec(),

      this.opportunityModel.countDocuments(overdueFilter).exec(),
    ]);

    let finalTodayOpps = todayOpps;
    if (isNameSort) {
      const dir = orderBy === 'Asc' ? 1 : -1;
      finalTodayOpps = [...todayOpps].sort((a, b) => {
        const nameA = (a.contactId as any)?.firstName || '';
        const nameB = (b.contactId as any)?.firstName || '';
        return nameA.localeCompare(nameB) * dir;
      });
    }

    return {
      summary: {
        totalToday: buyCount + rentLeaseCount + otherCount,
        buy: buyCount,
        rentLease: rentLeaseCount,
        other: otherCount,
        overdue: overdueCount,
      },
      todayOpportunities: finalTodayOpps,
      overdueOpportunities: overdueOpps,
    };
  }

  /**
   * Active pipeline pipeline summary — all In Progress opportunities.
   */
  async getOpenOpportunities(
    assignedTo?: string,
    branch?: string,
    sortBy = 'Create Date',
    orderBy: 'Asc' | 'Desc' = 'Desc',
    page = 1,
    limit = 20,
  ): Promise<{
    summary: {
      total: number;
      buy: number;
      rentLease: number;
      other: number;
      won: number;
      lost: number;
    };
    opportunities: any[];
  }> {
    const baseFilter: any = { status: OpportunityStatus.IN_PROGRESS };
    if (assignedTo) baseFilter.assignedTo = assignedTo;
    if (branch) baseFilter.branch = new RegExp(branch, 'i');

    const sortObj = this.buildSortObject(sortBy, orderBy);
    const isNameSort = sortBy === 'Name';

    const [opps, total, buy, rentLease, other, won, lost] = await Promise.all([
      this.opportunityModel
        .find(baseFilter)
        .populate(['contactId', 'assignedTo'])
        .sort(isNameSort ? { createdAt: -1 } : sortObj)
        .skip((page - 1) * limit)
        .limit(limit)
        .exec(),

      this.opportunityModel.countDocuments(baseFilter).exec(),
      this.opportunityModel
        .countDocuments({ ...baseFilter, purpose: OpportunityPurpose.BUY })
        .exec(),
      this.opportunityModel
        .countDocuments({
          ...baseFilter,
          purpose: OpportunityPurpose.RENT_LEASE,
        })
        .exec(),
      this.opportunityModel
        .countDocuments({
          ...baseFilter,
          purpose: {
            $nin: [OpportunityPurpose.BUY, OpportunityPurpose.RENT_LEASE],
          },
        })
        .exec(),

      this.opportunityModel
        .countDocuments({
          ...(assignedTo ? { assignedTo } : {}),
          ...(branch ? { branch: new RegExp(branch, 'i') } : {}),
          status: OpportunityStatus.WON,
        } as any)
        .exec(),
      this.opportunityModel
        .countDocuments({
          ...(assignedTo ? { assignedTo } : {}),
          ...(branch ? { branch: new RegExp(branch, 'i') } : {}),
          status: OpportunityStatus.LOST,
        } as any)
        .exec(),
    ]);

    let finalOpps = opps;
    if (isNameSort) {
      const dir = orderBy === 'Asc' ? 1 : -1;
      finalOpps = [...opps].sort((a, b) => {
        const nameA = (a.contactId as any)?.firstName || '';
        const nameB = (b.contactId as any)?.firstName || '';
        return nameA.localeCompare(nameB) * dir;
      });
    }

    return {
      summary: {
        total,
        buy,
        rentLease,
        other,
        won,
        lost,
      },
      opportunities: finalOpps,
    };
  }

  /**
   * Retrieves detailed CRM Opportunity configuration matching an exact primary key.
   */
  async findOne(id: string): Promise<any> {
    const opportunity = await this.opportunityModel
      .findById(id)
      .populate(['contactId', 'assignedTo', 'createdBy', 'updatedBy'])
      .exec();

    if (!opportunity) {
      throw new NotFoundException(`Opportunity with ID "${id}" not found`);
    }

    const oppObj = opportunity.toJSON();

    const assignDate = opportunity.assignDate || new Date();
    const diffTime = Math.abs(Date.now() - new Date(assignDate).getTime());
    const daysSinceAssigned = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    oppObj['daysSinceAssigned'] = daysSinceAssigned;

    return oppObj;
  }

  /**
   * Edits an existing CRM Opportunity configuration profile.
   */
  async update(
    id: string,
    updateOpportunityDto: UpdateOpportunityDto,
  ): Promise<OpportunityDocument> {
    const originalOpp = await this.opportunityModel.findById(id).exec();
    if (!originalOpp) {
      throw new NotFoundException(`Opportunity with ID "${id}" not found`);
    }

    const updatedOpp = await this.opportunityModel
      .findByIdAndUpdate(id, updateOpportunityDto, { new: true })
      .populate(['contactId', 'assignedTo', 'createdBy', 'updatedBy'])
      .exec();

    if (!updatedOpp) {
      throw new NotFoundException(`Opportunity with ID "${id}" not found`);
    }

    // Log the change in activities logs
    if (
      updateOpportunityDto.status &&
      originalOpp.status !== updateOpportunityDto.status
    ) {
      await this.activitiesService.log(
        `Updated stage of opportunity for customer "${(updatedOpp.contactId as any).firstName}" to "${updatedOpp.status}"`,
        ActivityType.OPPORTUNITY,
      );
    } else {
      await this.activitiesService.log(
        `Modified opportunity details for customer "${(updatedOpp.contactId as any).firstName}"`,
        ActivityType.OPPORTUNITY,
      );
    }

    return updatedOpp;
  }

  /**
   * Deletes a CRM Opportunity completely.
   */
  async remove(id: string): Promise<void> {
    const opp = await this.opportunityModel
      .findById(id)
      .populate('contactId')
      .exec();
    if (!opp) {
      throw new NotFoundException(`Opportunity with ID "${id}" not found`);
    }

    await this.opportunityModel.findByIdAndDelete(id).exec();

    const customerName = opp.contactId
      ? `${opp.contactId.firstName} ${opp.contactId.lastName || ''}`.trim()
      : 'Unknown';

    await this.activitiesService.log(
      `Deleted opportunity for customer "${customerName}"`,
      ActivityType.OPPORTUNITY,
    );
  }

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
      Name: 'contactId',
    };
    const field = fieldMap[sortBy] ?? 'createdAt';
    return { [field]: dir };
  }

  async sendSms(id: string, dto: SendLeadSmsDto, defaultUserId?: string) {
    const opp = await this.opportunityModel.findById(id).populate('contactId').exec();
    if (!opp) {
      throw new NotFoundException(`Opportunity with ID "${id}" not found`);
    }

    const contact = opp.contactId;
    if (!contact || !contact.mobile) {
      throw new BadRequestException('Opportunity contact has no mobile number registered');
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

    await this.activitiesService.log(
      `Sent SMS to "${contact.firstName} ${contact.lastName || ''}": "${dto.message}"`,
      ActivityType.OPPORTUNITY,
      defaultUserId,
    );

    return { success: true };
  }

  async sendEmail(id: string, dto: SendLeadEmailDto, defaultUserId?: string) {
    const opp = await this.opportunityModel.findById(id).populate('contactId').exec();
    if (!opp) {
      throw new NotFoundException(`Opportunity with ID "${id}" not found`);
    }

    const contact = opp.contactId;
    if (!contact || !contact.email) {
      throw new BadRequestException('Opportunity contact has no email address registered');
    }

    await this.emailsService.schedule({
      to: contact.email.trim(),
      subject: dto.subject,
      body: dto.message,
      scheduleDate: dto.scheduleDate,
      scheduleTime: dto.scheduleTime,
      createdBy: defaultUserId,
    });

    await this.activitiesService.log(
      `Sent Email to "${contact.firstName} ${contact.lastName || ''}" | Subject: "${dto.subject}"`,
      ActivityType.OPPORTUNITY,
      defaultUserId,
    );

    return { success: true };
  }

  async addQuickNote(
    id: string,
    dto: LeadQuickNoteDto,
    defaultUserId?: string,
  ) {
    const opp = await this.opportunityModel.findById(id).populate('contactId').exec();
    if (!opp) {
      throw new NotFoundException(`Opportunity with ID "${id}" not found`);
    }

    const customerName = opp.contactId
      ? `${opp.contactId.firstName} ${opp.contactId.lastName || ''}`.trim()
      : 'Unknown';
    await this.activitiesService.log(
      `Added Quick Note [Type: ${dto.commentType}] to opportunity for "${customerName}": "${dto.comment}"`,
      ActivityType.OPPORTUNITY,
      defaultUserId,
    );

    return { success: true };
  }

  async sendProposal(id: string, dto: SendProposalDto, defaultUserId?: string) {
    const opp = await this.opportunityModel.findById(id).populate('contactId').exec();
    if (!opp) {
      throw new NotFoundException(`Opportunity with ID "${id}" not found`);
    }

    const customerName = opp.contactId
      ? `${opp.contactId.firstName} ${opp.contactId.lastName || ''}`.trim()
      : 'Unknown';
    const recipientEmail =
      (opp.contactId as any)?.email || 'no-email-defined@crm.com';

    await this.activitiesService.log(
      `Sent Proposal to "${customerName}" (${recipientEmail}) | Language: ${dto.language}, Module: ${dto.module}, Project: ${dto.propertyProject}, Template: ${dto.template}`,
      ActivityType.OPPORTUNITY,
      defaultUserId,
    );

    return { success: true };
  }

  async changeStatus(id: string, dto: ChangeLeadStatusDto) {
    const opp = await this.opportunityModel.findById(id).populate('contactId').exec();
    if (!opp) {
      throw new NotFoundException(`Opportunity with ID "${id}" not found`);
    }

    opp.status = dto.status as any;
    if (dto.outcome) {
      opp.scheduleRemark = dto.outcome;
    }
    await opp.save();

    const customerName = opp.contactId
      ? `${opp.contactId.firstName} ${opp.contactId.lastName || ''}`.trim()
      : 'Unknown';

    await this.activitiesService.log(
      `Updated stage of opportunity for customer "${customerName}" to "${opp.status}" | Outcome: "${dto.outcome}"`,
      ActivityType.OPPORTUNITY,
    );

    return opp;
  }

  async updateRequirement(id: string, dto: UpdateRequirementDto) {
    const opp = await this.opportunityModel.findById(id).populate('contactId').exec();
    if (!opp) {
      throw new NotFoundException(`Opportunity with ID "${id}" not found`);
    }

    opp.description = dto.requirement;
    await opp.save();

    const customerName = opp.contactId
      ? `${opp.contactId.firstName} ${opp.contactId.lastName || ''}`.trim()
      : 'Unknown';

    await this.activitiesService.log(
      `Modified opportunity requirements for "${customerName}": "${dto.requirement}"`,
      ActivityType.OPPORTUNITY,
    );

    return opp;
  }

  async downloadExcel(query: any): Promise<string> {
    const csvContent = await this.generateOpportunitiesCsv(query);
    return csvContent;
  }

  async uploadToGoogleDrive(query: any, inputLimit?: number): Promise<any> {
    const csvContent = await this.generateOpportunitiesCsv(query);
    const fileName = `opportunities_export_${new Date().toISOString().slice(0, 10)}.csv`;
    return this.uploadCsvToGoogleDrive(csvContent, fileName);
  }

  private async generateOpportunitiesCsv(query: any): Promise<string> {
    const { opportunities } = await this.findAll({ ...query, limit: query.limit || 99999 });

    const headers = [
      'Opportunity ID',
      'Customer Name',
      'Mobile Number',
      'Email',
      'Request Date',
      'Est Close Date',
      'For (Purpose)',
      'Looking For',
      'Min Budget',
      'Max Budget',
      'Budget Unit',
      'Min Area',
      'Max Area',
      'Area Unit',
      'City',
      'Locality',
      'Bedroom',
      'Furnishing',
      'Transaction',
      'Preferences',
      'Property Age',
      'Description',
      'Internal Note',
      'Stage/Purpose',
      'Schedule Date',
      'Schedule Time',
      'Schedule Where',
      'Schedule Remark',
      'Keyword',
      'Refer By',
      'Folder',
      'Source',
      'Branch',
      'Assigned To',
      'Status',
      'Created At',
    ];

    const rows = opportunities.map((o: any) => {
      const contact = o.contactId || {};
      const customerName = `${contact.salutation ? contact.salutation + ' ' : ''}${contact.firstName || ''} ${contact.lastName || ''}`.trim();
      const mobileVal = contact.mobile || '';
      const emailVal = contact.email || '';
      const assignedToVal = o.assignedTo?.firstName || '';

      return [
        o.id || o._id?.toString() || '',
        customerName || 'Unknown Customer',
        mobileVal,
        emailVal,
        o.requestDate || '',
        o.estCloseDate || '',
        o.purpose || '',
        o.lookingFor || '',
        o.minBudget != null ? o.minBudget.toString() : '',
        o.maxBudget != null ? o.maxBudget.toString() : '',
        o.budgetUnit || '',
        o.minArea != null ? o.minArea.toString() : '',
        o.maxArea != null ? o.maxArea.toString() : '',
        o.areaUnit || '',
        o.city || '',
        o.locality || '',
        o.bedroom || '',
        o.furnishing || '',
        o.transaction || '',
        o.purposePref || '',
        o.propertyAge || '',
        o.description || '',
        o.internalNote || '',
        o.schedulePurpose || '',
        o.scheduleDate || '',
        o.scheduleTime || '',
        o.scheduleWhere || '',
        o.scheduleRemark || '',
        o.keyword || '',
        o.referBy || '',
        o.folder || '',
        o.source || '',
        o.branch || '',
        assignedToVal,
        o.status || '',
        o.createdAt && !isNaN(new Date(o.createdAt).getTime()) ? new Date(o.createdAt).toISOString() : '',
      ];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map((r) =>
        r.map((val) => `"${val.replace(/"/g, '""')}"`).join(','),
      ),
    ].join('\n');

    return '\ufeff' + csvContent;
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

        const boundary = 'opportunities_upload_boundary_12345';
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

      const backupFileName = `opportunities_drive_backup_${new Date().toISOString().replace(/[:.]/g, '-')}.csv`;
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
      console.error('Google Drive export simulation failed:', err);
      throw new Error(`Export to Google Drive failed: ${err.message}`);
    }
  }

  async importOpportunities(opportunities: any[], defaultUserId?: string) {
    const limit = 2000;
    const slice = opportunities.slice(0, limit);
    const createdOpportunities: any[] = [];

    const defaultUser = await this.userModel.findOne().exec();
    const fallbackUserId = defaultUserId || (defaultUser ? defaultUser._id.toString() : undefined);

    const users = await this.userModel.find().exec();
    const findUserId = (assignedVal: any): string | undefined => {
      if (!assignedVal) return fallbackUserId;
      const valStr = assignedVal.toString().trim();
      if (!valStr) return fallbackUserId;

      const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(valStr);
      if (isValidObjectId) {
        return valStr;
      }

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
      const rawMobile = (item.Customer_Mobile || item.mobile || item['Customer Mobile'] || '').toString().trim();
      const name = (item.Customer_Name || item.name || item['Customer Name'] || '').toString().trim();

      if (!name || !rawMobile) continue;

      const parsedPhone = parseMobileAndCountryCode(rawMobile);
      const assignedToId = findUserId(item.assignedTo || item['Assigned To']);

      let contact = await this.contactModel.findOne({
        mobile: parsedPhone.mobile,
        countryCode: parsedPhone.countryCode,
        isDeleted: { $ne: true }
      }).exec();

      if (!contact) {
        let salutation: string | undefined = undefined;
        let fName = name;
        let lName: string | undefined = undefined;

        const nameParts = name.split(/\s+/);
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
          email: item.Customer_Email || item.email || item['Customer Email'] || '',
          companyName: item.Customer_Company || item.company || item['Customer Company'] || '',
          customerType: 'Customer',
          contactType: 'Employee',
          branch: item.Branch || item.branch || 'Global Team',
          source: item.Source || item.source || 'Spreadsheet Import',
          assignedTo: assignedToId,
        });
        await contact.save();
      }

      // Read requirement/details
      const requestDate = item.Request_Date || item.requestDate || item['Request Date'] || new Date().toISOString().split('T')[0];
      
      let purposeVal = (item.For || item.purpose || item['For (Purpose)'] || 'Buy').toString().trim();
      if (purposeVal.toLowerCase().includes('rent') || purposeVal.toLowerCase().includes('lease')) {
        purposeVal = 'Rent/Lease';
      } else if (purposeVal.toLowerCase().includes('pg')) {
        purposeVal = 'PG';
      } else if (purposeVal.toLowerCase().includes('joint')) {
        purposeVal = 'Joint Ventures';
      } else if (purposeVal.toLowerCase().includes('service')) {
        purposeVal = 'Services';
      } else if (purposeVal.toLowerCase().includes('re-dev') || purposeVal.toLowerCase().includes('redev')) {
        purposeVal = 'Re-Development';
      } else {
        purposeVal = 'Buy';
      }

      const lookingFor = item.Looking_For || item.lookingFor || item['Looking For'] || 'Residential Apartment';
      const minBudget = Number(item.Min_Budget || item.minBudget || item['Min Budget'] || 0);
      const maxBudget = Number(item.Max_Budget || item.maxBudget || item['Max Budget'] || 0);
      const budgetUnit = item.Budget_Unit || item.budgetUnit || item['Budget Unit'] || 'Lacs';
      const minArea = Number(item.Min_Area || item.minArea || item['Min Area'] || 0);
      const maxArea = Number(item.Max_Area || item.maxArea || item['Max Area'] || 0);
      
      let areaUnitVal = (item.Area_Unit || item.areaUnit || item['Area Unit'] || 'Sq.Ft.').toString().trim();
      if (areaUnitVal.toLowerCase().includes('sq') && areaUnitVal.toLowerCase().includes('ft')) {
        areaUnitVal = 'Sq.Ft.';
      } else if (areaUnitVal.toLowerCase().includes('meter')) {
        areaUnitVal = 'Sq.Meter';
      } else if (areaUnitVal.toLowerCase().includes('ground')) {
        areaUnitVal = 'Grounds';
      } else if (areaUnitVal.toLowerCase().includes('aank')) {
        areaUnitVal = 'Aankadam';
      } else if (areaUnitVal.toLowerCase().includes('rood')) {
        areaUnitVal = 'Rood';
      } else {
        areaUnitVal = 'Sq.Ft.';
      }

      const city = item.City || item.city || 'Global';
      const locality = item.Locality || item.locality || 'Global';
      const bedroom = item.Bedroom || item.bedroom || '';
      
      let furnishingVal = (item.Furnishing || item.furnishing || '').toString().trim();
      if (furnishingVal) {
        const cleanFurn = furnishingVal.toLowerCase();
        if (cleanFurn.includes('fully')) furnishingVal = 'Fully Furnished';
        else if (cleanFurn.includes('semi')) furnishingVal = 'Semi Furnished';
        else if (cleanFurn.includes('un')) furnishingVal = 'UnFurnished';
        else if (cleanFurn.includes('ready')) furnishingVal = 'Ready to Furnished';
        else if (cleanFurn.includes('bare')) furnishingVal = 'Bareshell';
        else furnishingVal = '';
      }

      const transaction = item.Transaction || item.transaction || '';
      const purposePref = item.Preferences || item.preferences || item.purposePref || '';
      const propertyAge = item.Property_Age || item.propertyAge || item['Property Age'] || '';
      const description = item.Description || item.description || '';
      const internalNote = item.Internal_Note || item.internalNote || item['Internal Note'] || '';
      const schedulePurpose = item.Stage || item.schedulePurpose || item['Stage/Purpose'] || 'Site Visit';
      const scheduleDate = item.Schedule_Date || item.scheduleDate || item['Schedule Date'] || new Date().toISOString().split('T')[0];
      const scheduleTime = item.Schedule_Time || item.scheduleTime || item['Schedule Time'] || '12:00pm';
      const scheduleWhere = item.Schedule_Where || item.scheduleWhere || item['Schedule Where'] || '';
      const scheduleRemark = item.Schedule_Remark || item.scheduleRemark || item['Schedule Remark'] || '';
      const keyword = item.Keyword || item.keyword || '';
      const referBy = item.Refer_By || item.referBy || item['Refer By'] || '';
      const folder = item.Folder || item.folder || '';
      const source = item.Source || item.source || 'Spreadsheet Import';
      const branch = item.Branch || item.branch || 'Global Team';
      
      let statusVal = (item.Status || item.status || 'In Progress').toString().trim();
      if (statusVal) {
        const cleanStatus = statusVal.toLowerCase();
        if (cleanStatus.includes('won')) statusVal = 'Won';
        else if (cleanStatus.includes('lost')) statusVal = 'Lost';
        else statusVal = 'In Progress';
      } else {
        statusVal = 'In Progress';
      }

      const newOpportunity = new this.opportunityModel({
        contactId: contact._id,
        requestDate,
        purpose: purposeVal,
        lookingFor,
        minBudget,
        maxBudget,
        budgetUnit,
        minArea,
        maxArea,
        areaUnit: areaUnitVal,
        city,
        locality,
        bedroom: bedroom || undefined,
        furnishing: furnishingVal || undefined,
        transaction: transaction || undefined,
        purposePref: purposePref || undefined,
        propertyAge: propertyAge || undefined,
        description: description || undefined,
        internalNote: internalNote || undefined,
        schedulePurpose,
        scheduleDate,
        scheduleTime,
        scheduleWhere: scheduleWhere || undefined,
        scheduleRemark: scheduleRemark || undefined,
        keyword: keyword || undefined,
        referBy: referBy || undefined,
        folder: folder || undefined,
        source,
        branch,
        assignedTo: assignedToId,
        status: statusVal,
      });

      await newOpportunity.save();
      createdOpportunities.push(newOpportunity);
    }

    return {
      success: true,
      count: createdOpportunities.length,
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
