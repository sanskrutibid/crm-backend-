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

@Injectable()
export class OpportunitiesService {
  constructor(
    @InjectModel(Opportunity.name)
    private readonly opportunityModel: Model<OpportunityDocument>,
    @InjectModel(Contact.name)
    private readonly contactModel: Model<ContactDocument>,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    private readonly activitiesService: ActivitiesService,
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

      const newContact = new this.contactModel({
        salutation,
        firstName,
        lastName,
        customerType: 'Customer',
        contactType: 'Employee',
        mobile: createOpportunityDto.mobile,
        email: createOpportunityDto.email
          ? createOpportunityDto.email.toLowerCase().trim()
          : undefined,
        companyName: createOpportunityDto.company,
        source: createOpportunityDto.source || 'Website',
        branch: createOpportunityDto.branch || 'Global Team',
        assignedTo: assignedTo,
      });

      const savedContact = await newContact.save();
      targetContactId = savedContact._id.toString();

      await this.activitiesService.log(
        `Created new contact "${createOpportunityDto.name}" on-the-fly during opportunity creation`,
        ActivityType.OPPORTUNITY,
        defaultUserId,
      );
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
        .countDocuments({ ...todayFilter, purpose: OpportunityPurpose.RENT_LEASE })
        .exec(),
      this.opportunityModel
        .countDocuments({ ...todayFilter, purpose: { $notin: [OpportunityPurpose.BUY, OpportunityPurpose.RENT_LEASE] } })
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
        .countDocuments({ ...baseFilter, purpose: OpportunityPurpose.RENT_LEASE })
        .exec(),
      this.opportunityModel
        .countDocuments({ ...baseFilter, purpose: { $notin: [OpportunityPurpose.BUY, OpportunityPurpose.RENT_LEASE] } })
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
    if (updateOpportunityDto.status && originalOpp.status !== updateOpportunityDto.status) {
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
    const opp = await this.opportunityModel.findById(id).populate('contactId').exec();
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
}
