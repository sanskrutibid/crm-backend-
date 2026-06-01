import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  Activity,
  ActivityDocument,
  ActivityType,
} from './schemas/activity.schema';
import { CreateActivityDto } from './dto/create-activity.dto';
import { QueryActivityDto } from './dto/query-activity.dto';
import { User, UserDocument } from '../users/schemas/user.schema';

@Injectable()
export class ActivitiesService implements OnModuleInit {
  constructor(
    @InjectModel(Activity.name)
    private readonly activityModel: Model<ActivityDocument>,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  /**
   * Seed default activity logs if the database collection is empty,
   * associating logs with the first available system user.
   */
  async onModuleInit() {
    const logCount = await this.activityModel.countDocuments().exec();
    if (logCount === 0) {
      const defaultUser = await this.userModel.findOne().exec();
      const userId = defaultUser ? defaultUser._id : undefined;

      const initialLogs: Partial<Activity>[] = [
        {
          description:
            'Booking confirmed! Token received for Skyline Business Hub',
          type: ActivityType.LEAD,
          timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000),
          performedBy: userId as any,
        },
        {
          description: 'Scheduled a Site Visit for Greenwood Luxury Residency',
          type: ActivityType.TASK,
          timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
          performedBy: userId as any,
        },
        {
          description: 'Added a new property listing "Solitaire Penthouse"',
          type: ActivityType.PROPERTY,
          timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
          performedBy: userId as any,
        },
        {
          description: 'B2BBricks Real Estate Sync Engine online',
          type: ActivityType.SYSTEM,
          timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        },
      ];
      await this.activityModel.insertMany(initialLogs);
      console.log(
        '🌱 Successfully seeded initial Activity Logs database collection.',
      );
    }
  }

  /**
   * Standard programmatic log method.
   * Allows other backend modules to log events without making HTTP requests.
   */
  async log(
    description: string,
    type: ActivityType,
    performedByUserId?: string,
  ): Promise<ActivityDocument> {
    const newActivity = new this.activityModel({
      description,
      type,
      performedBy: performedByUserId,
      timestamp: new Date(),
    });
    const savedLog = await newActivity.save();
    if (performedByUserId) {
      return savedLog.populate('performedBy');
    }
    return savedLog;
  }

  async create(
    createActivityDto: CreateActivityDto,
    defaultUserId?: string,
  ): Promise<ActivityDocument> {
    const performedBy = createActivityDto.performedBy || defaultUserId;
    const newActivity = new this.activityModel({
      ...createActivityDto,
      performedBy,
    });
    const savedLog = await newActivity.save();
    if (performedBy) {
      return savedLog.populate('performedBy');
    }
    return savedLog;
  }

  async findAll(
    query: QueryActivityDto,
  ): Promise<{ activities: ActivityDocument[]; total: number }> {
    const { type, search, page = 1, limit = 10 } = query;
    const filter: any = {};

    if (type) {
      filter.type = type;
    }

    if (search) {
      filter.description = new RegExp(search, 'i');
    }

    const total = await this.activityModel.countDocuments(filter).exec();
    const activities = await this.activityModel
      .find(filter)
      .populate('performedBy')
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ timestamp: -1 }) // Get the most recent first
      .exec();

    return { activities, total };
  }

  async findLogsForContact(
    contactName: string,
    id: string,
    uniqueNumber?: string,
  ): Promise<ActivityDocument[]> {
    const orConditions: any[] = [
      { description: new RegExp(contactName, 'i') },
      { description: new RegExp(id, 'i') },
    ];

    if (uniqueNumber) {
      orConditions.push({ description: new RegExp(uniqueNumber, 'i') });
    }

    return this.activityModel
      .find({ $or: orConditions })
      .populate('performedBy')
      .sort({ timestamp: -1 })
      .exec();
  }
}
