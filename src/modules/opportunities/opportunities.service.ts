import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Opportunity, OpportunityDocument, OpportunityStatus } from './schemas/opportunity.schema';
import { Contact, ContactDocument } from '../contacts/schemas/contact.schema';
import { User, UserDocument } from '../users/schemas/user.schema';
import { CreateOpportunityDto } from './dto/create-opportunity.dto';
import { ActivitiesService } from '../activities/activities.service';
import { ActivityType } from '../activities/schemas/activity.schema';

@Injectable()
export class OpportunitiesService {
  constructor(
    @InjectModel(Opportunity.name) private readonly opportunityModel: Model<OpportunityDocument>,
    @InjectModel(Contact.name) private readonly contactModel: Model<ContactDocument>,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    private readonly activitiesService: ActivitiesService,
  ) {}

  async create(createOpportunityDto: CreateOpportunityDto, defaultUserId: string): Promise<OpportunityDocument> {
    const assignedTo = createOpportunityDto.assignedTo || defaultUserId;
    let targetContactId = createOpportunityDto.contactId;

    // 1. Handle on-the-fly Contact creation if requested
    if (createOpportunityDto.addNewContact) {
      if (!createOpportunityDto.name || !createOpportunityDto.mobile) {
        throw new BadRequestException('Name and Mobile are required to create a new contact on-the-fly');
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
        email: createOpportunityDto.email ? createOpportunityDto.email.toLowerCase().trim() : undefined,
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
        throw new BadRequestException('Either contactId must be provided or addNewContact must be set to true');
      }

      // Verify the contact exists
      const contactExists = await this.contactModel.findById(targetContactId).exec();
      if (!contactExists) {
        throw new NotFoundException(`Contact with ID ${targetContactId} not found`);
      }
    }

    // 2. Fetch target contact for descriptive activity log details
    const targetContact = await this.contactModel.findById(targetContactId).exec();
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
    return savedOpportunity.populate(['contactId', 'assignedTo', 'createdBy', 'updatedBy']);
  }

  async getMyOpportunities(
    userId: string,
    sortBy = 'Create Date',
    orderBy: 'Asc' | 'Desc' = 'Desc',
    page = 1,
    limit = 20,
  ): Promise<{
    totalRecords: number;
    opportunities: OpportunityDocument[];
  }> {
    const isNameSort = sortBy === 'Name';
    const sortObj = this.buildSortObject(sortBy, orderBy);

    const filter: any = {
      $or: [
        { assignedTo: userId },
        { createdBy: userId },
      ],
    };

    const totalRecords = await this.opportunityModel.countDocuments(filter).exec();

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

  private buildSortObject(sortBy: string, orderBy: 'Asc' | 'Desc'): Record<string, 1 | -1> {
    const dir: 1 | -1 = orderBy === 'Asc' ? 1 : -1;
    const fieldMap: Record<string, string> = {
      'Assigned Date': 'assignDate',
      'Create Date':   'createdAt',
      'FollowUp Date': 'scheduleDate',
      'Updated Date':  'updatedAt',
      'Name':          'contactId', // in-memory sort applied after populate
    };
    const field = fieldMap[sortBy] ?? 'createdAt';
    return { [field]: dir };
  }
}
