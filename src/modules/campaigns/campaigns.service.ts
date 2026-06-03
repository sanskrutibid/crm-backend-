import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Campaign, CampaignDocument } from './schemas/campaign.schema';
import { Contact, ContactDocument } from '../contacts/schemas/contact.schema';
import { CreateCampaignDto } from './dto/create-campaign.dto';
import { UpdateCampaignDto } from './dto/update-campaign.dto';
import { QueryCampaignDto } from './dto/query-campaign.dto';
import { ActivitiesService } from '../activities/activities.service';
import { ActivityType } from '../activities/schemas/activity.schema';

@Injectable()
export class CampaignsService {
  constructor(
    @InjectModel(Campaign.name) private readonly campaignModel: Model<CampaignDocument>,
    @InjectModel(Contact.name) private readonly contactModel: Model<ContactDocument>,
    private readonly activitiesService: ActivitiesService,
  ) {}

  async create(dto: CreateCampaignDto, userId?: string): Promise<CampaignDocument> {
    // Validate schedule inputs
    this.validateSchedule(dto);

    // Resolve contacts based on selection or filters
    let contactIds = dto.contactIds;
    if (!contactIds || contactIds.length === 0) {
      contactIds = await this.resolveContactsFromFilters(dto.recipientFilters);
    }

    const newCampaign = new this.campaignModel({
      ...dto,
      contacts: contactIds,
      totalRecords: contactIds.length,
      createdBy: userId,
    });

    const saved = await newCampaign.save();

    await this.activitiesService.log(
      `Created campaign "${saved.name}" [Type: ${saved.type}, Schedule: ${saved.schedule}] with ${saved.totalRecords} recipients`,
      ActivityType.SYSTEM,
      userId,
    );

    return saved.populate(['contacts', 'createdBy']);
  }

  async findAll(query: QueryCampaignDto): Promise<{ campaigns: CampaignDocument[]; total: number }> {
    const {
      search,
      type,
      schedule,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = 1,
      limit = 10,
    } = query;

    const filter: any = {};

    if (type) {
      filter.type = type;
    }
    if (schedule) {
      filter.schedule = schedule;
    }
    if (search) {
      filter.name = new RegExp(search, 'i');
    }

    const sortDirection = sortOrder === 'asc' ? 1 : -1;
    const sortOption: any = { [sortBy]: sortDirection };

    const total = await this.campaignModel.countDocuments(filter).exec();

    const queryChain = this.campaignModel
      .find(filter)
      .populate(['contacts', 'createdBy'])
      .sort(sortOption);

    if (limit && limit > 0 && limit < 99999) {
      queryChain.skip((page - 1) * limit).limit(limit);
    }

    const campaigns = await queryChain.exec();
    return { campaigns, total };
  }

  async findOne(id: string): Promise<CampaignDocument> {
    const campaign = await this.campaignModel
      .findById(id)
      .populate(['contacts', 'createdBy', 'updatedBy'])
      .exec();
    if (!campaign) {
      throw new NotFoundException(`Campaign with ID "${id}" not found`);
    }
    return campaign;
  }

  async update(id: string, dto: UpdateCampaignDto, userId?: string): Promise<CampaignDocument> {
    const campaign = await this.campaignModel.findById(id).exec();
    if (!campaign) {
      throw new NotFoundException(`Campaign with ID "${id}" not found`);
    }

    if (dto.schedule) {
      this.validateSchedule({ ...campaign.toObject(), ...dto });
    }

    // If filters or contactIds are updated, recalculate contacts
    let contactIds = dto.contactIds;
    if (dto.recipientFilters && (!dto.contactIds || dto.contactIds.length === 0)) {
      contactIds = await this.resolveContactsFromFilters(dto.recipientFilters);
    }

    const updateData: any = {
      ...dto,
      ...(contactIds ? { contacts: contactIds, totalRecords: contactIds.length } : {}),
      updatedBy: userId,
    };

    const updated = await this.campaignModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .populate(['contacts', 'createdBy', 'updatedBy'])
      .exec();

    if (!updated) {
      throw new NotFoundException(`Campaign with ID "${id}" not found`);
    }

    await this.activitiesService.log(
      `Updated campaign "${updated.name}"`,
      ActivityType.SYSTEM,
      userId,
    );

    return updated;
  }

  async remove(id: string, userId?: string): Promise<void> {
    const campaign = await this.campaignModel.findById(id).exec();
    if (!campaign) {
      throw new NotFoundException(`Campaign with ID "${id}" not found`);
    }
    await this.campaignModel.findByIdAndDelete(id).exec();
    await this.activitiesService.log(
      `Deleted campaign "${campaign.name}"`,
      ActivityType.SYSTEM,
      userId,
    );
  }

  private validateSchedule(dto: any) {
    const { schedule, time, setWeeks, setDays } = dto;
    if (schedule === 'Daily') {
      if (!time) throw new BadRequestException('Time is required for Daily schedule');
    } else if (schedule === 'Weekly') {
      if (!time) throw new BadRequestException('Time is required for Weekly schedule');
      if (!setWeeks || setWeeks.length === 0) {
        throw new BadRequestException('At least one weekday (setWeeks) is required for Weekly schedule');
      }
    } else if (schedule === 'Monthly') {
      if (!time) throw new BadRequestException('Time is required for Monthly schedule');
      if (!setDays || setDays.length === 0) {
        throw new BadRequestException('At least one calendar date (setDays) is required for Monthly schedule');
      }
    }
  }

  private async resolveContactsFromFilters(filters?: any): Promise<string[]> {
    const filter: any = { isDeleted: { $ne: true } };
    if (!filters) {
      const all = await this.contactModel.find(filter, { _id: 1 }).exec();
      return all.map((c) => c._id.toString());
    }

    const {
      customerType,
      contactType,
      branch,
      assignedTo,
      city,
      location,
      folder,
      source,
      dndOptions,
      createDateFrom,
      createDateTo,
    } = filters;

    if (customerType && customerType.trim() !== '') filter.customerType = customerType;
    if (contactType && contactType.trim() !== '') filter.contactType = contactType;
    if (branch && branch.trim() !== '') filter.branch = branch;
    if (assignedTo && assignedTo.trim() !== '') filter.assignedTo = assignedTo;
    if (city && city.trim() !== '') filter.city = new RegExp(city, 'i');
    
    if (location && location.trim() !== '') {
      filter.$or = [
        { locality: new RegExp(location, 'i') },
        { professionalLocality: new RegExp(location, 'i') },
        { address: new RegExp(location, 'i') }
      ];
    }
    
    if (folder && folder.trim() !== '') filter.folder = folder;
    if (source && source.trim() !== '') filter.source = source;
    if (dndOptions && dndOptions.trim() !== '') filter.dndStatus = dndOptions;

    if ((createDateFrom && createDateFrom.trim() !== '') || (createDateTo && createDateTo.trim() !== '')) {
      filter.createdAt = {};
      if (createDateFrom && createDateFrom.trim() !== '') filter.createdAt.$gte = new Date(createDateFrom);
      if (createDateTo && createDateTo.trim() !== '') filter.createdAt.$lte = new Date(createDateTo);
    }

    const matched = await this.contactModel.find(filter, { _id: 1 }).exec();
    return matched.map((c) => c._id.toString());
  }
}
