import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { SiteVisit, SiteVisitDocument } from './schemas/site-visit.schema';
import { CreateSiteVisitDto } from './dto/create-site-visit.dto';
import { UpdateSiteVisitDto } from './dto/update-site-visit.dto';
import { QuerySiteVisitDto } from './dto/query-site-visit.dto';
import { User, UserDocument } from '../users/schemas/user.schema';
import { ActivitiesService } from '../activities/activities.service';
import { ActivityType } from '../activities/schemas/activity.schema';

@Injectable()
export class SiteVisitsService implements OnModuleInit {
  constructor(
    @InjectModel(SiteVisit.name)
    private readonly siteVisitModel: Model<SiteVisitDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    private readonly activitiesService: ActivitiesService,
  ) {}

  /**
   * Seed default site visits on database start if the collection is empty.
   */
  async onModuleInit() {
    const count = await this.siteVisitModel.countDocuments().exec();
    if (count === 0) {
      const defaultUser = await this.userModel.findOne().exec();
      if (defaultUser) {
        const initialVisits: Partial<SiteVisit>[] = [
          {
            visitor: 'Avinash Bhute',
            visitType: 'First Visit',
            module: 'Lead',
            siteName: 'Metro City',
            otherName: 'Building A',
            visitDate: new Date().toISOString().split('T')[0],
            timeIn: '11:26 AM',
            timeOut: '12:10 PM',
            remark: 'Interested in a 3 BHK flat. Wants to see banking partners.',
            siteManager: 'Gourav Raut',
            sourcingManager: 'Vikram Singh',
            closingManager: 'Sneha Nair',
            source: 'Direct',
            branch: 'Mumbai Bandra',
            assignee: defaultUser._id as any,
            visitStatus: 'Scheduled',
            sendSmsNotification: false,
            sendEmailNotification: true,
            isPrivate: false,
            photograph: '',
            latitude: 21.1458,
            longitude: 79.0882,
            createdBy: defaultUser._id as any,
            lockingDaysLeft: 5,
            noOfReVisit: 1,
            reasons: 'Client satisfied with sample unit design layout',
          },
          {
            visitor: 'Priya Sharma',
            visitType: 'Follow-up Visit',
            module: 'Contact',
            siteName: 'Greenwood Luxury Residency',
            otherName: 'Villa 12',
            visitDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            timeIn: '02:00 PM',
            timeOut: '03:30 PM',
            remark: 'Amenities walkthrough and booking documentation discussion.',
            siteManager: 'Sanjay Shah',
            sourcingManager: 'Amit Roy',
            closingManager: 'Rohan Kapoor',
            source: 'Broker',
            branch: 'Pune Solitaire',
            assignee: defaultUser._id as any,
            visitStatus: 'Completed',
            sendSmsNotification: true,
            sendEmailNotification: true,
            isPrivate: true,
            photograph: '',
            latitude: 18.5204,
            longitude: 73.8567,
            createdBy: defaultUser._id as any,
            lockingDaysLeft: 0,
            noOfReVisit: 2,
            reasons: 'Amenities tour completed, booking form signed',
          },
        ];

        await this.siteVisitModel.insertMany(initialVisits);
        console.log('🌱 Successfully seeded initial Site Visits database collection.');
      } else {
        console.log('⚠️ No users found in database to assign seed Site Visits to. Seeding skipped.');
      }
    }
  }

  async create(createDto: CreateSiteVisitDto, defaultUserId?: string): Promise<SiteVisitDocument> {
    const assignee = createDto.assignee || defaultUserId;
    const createdBy = createDto.createdBy || defaultUserId;
    const newVisit = new this.siteVisitModel({
      ...createDto,
      assignee,
      createdBy,
    });
    const saved = await newVisit.save();

    // Log the action
    await this.activitiesService.log(
      `Scheduled site visit for visitor "${saved.visitor}" to "${saved.siteName || 'N/A'}" on ${saved.visitDate} | Visit Status: "${saved.visitStatus}"`,
      ActivityType.SITE_VISIT,
      defaultUserId,
    );

    return saved.populate(['assignee', 'createdBy', 'contactId']);
  }

  async findAll(query: QuerySiteVisitDto): Promise<{ siteVisits: SiteVisitDocument[]; total: number }> {
    const {
      search,
      keyword,
      visitType,
      module: searchModule,
      visitStatus,
      status,
      source,
      branch,
      assignee,
      assignTo,
      submittedBy,
      siteName,
      visitDateFrom,
      visitDateTo,
      createDateFrom,
      createDateTo,
      lockingDaysFrom,
      lockingDaysTo,
      noOfReVisitFrom,
      noOfReVisitTo,
      reasons,
      isPrivate,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = 1,
      limit = 10,
    } = query;

    const filter: any = {};

    if (visitType) {
      filter.visitType = visitType;
    }

    if (searchModule) {
      filter.module = searchModule;
    }

    const currentStatus = visitStatus || status;
    if (currentStatus) {
      filter.visitStatus = currentStatus;
    }

    if (source) {
      filter.source = source;
    }

    if (branch) {
      filter.branch = new RegExp(branch, 'i');
    }

    const currentAssignee = assignTo || assignee;
    if (currentAssignee) {
      filter.assignee = currentAssignee;
    }

    if (submittedBy) {
      filter.createdBy = submittedBy;
    }

    if (siteName) {
      filter.siteName = new RegExp(siteName, 'i');
    }

    if (isPrivate !== undefined) {
      filter.isPrivate = isPrivate;
    }

    if (reasons) {
      filter.reasons = new RegExp(reasons, 'i');
    }

    // Date range filtering for visitDate (string YYYY-MM-DD)
    if (visitDateFrom || visitDateTo) {
      filter.visitDate = {};
      if (visitDateFrom) {
        filter.visitDate.$gte = visitDateFrom;
      }
      if (visitDateTo) {
        filter.visitDate.$lte = visitDateTo;
      }
    }

    // Date range filtering for createdAt (Mongoose Date)
    if (createDateFrom || createDateTo) {
      filter.createdAt = {};
      if (createDateFrom) {
        filter.createdAt.$gte = new Date(createDateFrom);
      }
      if (createDateTo) {
        filter.createdAt.$lte = new Date(createDateTo);
      }
    }

    // Numeric range filtering for lockingDaysLeft
    if (lockingDaysFrom !== undefined || lockingDaysTo !== undefined) {
      filter.lockingDaysLeft = {};
      if (lockingDaysFrom !== undefined) {
        filter.lockingDaysLeft.$gte = lockingDaysFrom;
      }
      if (lockingDaysTo !== undefined) {
        filter.lockingDaysLeft.$lte = lockingDaysTo;
      }
    }

    // Numeric range filtering for noOfReVisit
    if (noOfReVisitFrom !== undefined || noOfReVisitTo !== undefined) {
      filter.noOfReVisit = {};
      if (noOfReVisitFrom !== undefined) {
        filter.noOfReVisit.$gte = noOfReVisitFrom;
      }
      if (noOfReVisitTo !== undefined) {
        filter.noOfReVisit.$lte = noOfReVisitTo;
      }
    }

    // General keyword text search
    const textSearch = search || keyword;
    if (textSearch) {
      filter.$or = [
        { visitor: new RegExp(textSearch, 'i') },
        { siteName: new RegExp(textSearch, 'i') },
        { otherName: new RegExp(textSearch, 'i') },
        { remark: new RegExp(textSearch, 'i') },
        { siteManager: new RegExp(textSearch, 'i') },
        { sourcingManager: new RegExp(textSearch, 'i') },
        { closingManager: new RegExp(textSearch, 'i') },
        { branch: new RegExp(textSearch, 'i') },
        { source: new RegExp(textSearch, 'i') },
        { visitStatus: new RegExp(textSearch, 'i') },
        { reasons: new RegExp(textSearch, 'i') },
      ];
    }

    // Mapping sort fields based on Screenshot 3
    let sortField = 'createdAt';
    if (sortBy === 'Created Date') {
      sortField = 'createdAt';
    } else if (sortBy === 'Visitor Name') {
      sortField = 'visitor';
    } else if (sortBy === 'Status') {
      sortField = 'visitStatus';
    } else {
      sortField = sortBy;
    }

    const sortDirection = sortOrder === 'asc' ? 1 : -1;
    const sortOption: any = { [sortField]: sortDirection };

    const total = await this.siteVisitModel.countDocuments(filter).exec();

    const queryChain = this.siteVisitModel
      .find(filter)
      .populate(['assignee', 'createdBy', 'contactId'])
      .sort(sortOption);

    if (limit && limit > 0 && limit < 99999) {
      queryChain.skip((page - 1) * limit).limit(limit);
    }

    const siteVisits = await queryChain.exec();
    return { siteVisits, total };
  }

  async findOne(id: string): Promise<SiteVisitDocument> {
    const visit = await this.siteVisitModel
      .findById(id)
      .populate(['assignee', 'createdBy', 'contactId'])
      .exec();

    if (!visit) {
      throw new NotFoundException(`Site visit record with ID "${id}" not found`);
    }

    return visit;
  }

  async update(id: string, updateDto: UpdateSiteVisitDto, defaultUserId?: string): Promise<SiteVisitDocument> {
    const original = await this.siteVisitModel.findById(id).exec();
    if (!original) {
      throw new NotFoundException(`Site visit record with ID "${id}" not found`);
    }

    const updated = await this.siteVisitModel
      .findByIdAndUpdate(id, updateDto, { new: true })
      .populate(['assignee', 'createdBy', 'contactId'])
      .exec();

    if (!updated) {
      throw new NotFoundException(`Site visit record with ID "${id}" not found`);
    }

    // Log the action
    await this.activitiesService.log(
      `Modified site visit details for visitor "${updated.visitor}" to "${updated.siteName || 'N/A'}" | Status: "${updated.visitStatus}"`,
      ActivityType.SITE_VISIT,
      defaultUserId,
    );

    return updated;
  }

  async remove(id: string, defaultUserId?: string): Promise<void> {
    const visit = await this.siteVisitModel.findById(id).exec();
    if (!visit) {
      throw new NotFoundException(`Site visit record with ID "${id}" not found`);
    }

    await this.siteVisitModel.findByIdAndDelete(id).exec();

    // Log the action
    await this.activitiesService.log(
      `Deleted site visit for visitor "${visit.visitor}" (Site: "${visit.siteName || 'N/A'}")`,
      ActivityType.SITE_VISIT,
      defaultUserId,
    );
  }
}
