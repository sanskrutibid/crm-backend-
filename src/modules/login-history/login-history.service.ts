import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { LoginHistory, LoginHistoryDocument } from './schemas/login-history.schema';
import { QueryLoginHistoryDto } from './dto/query-login-history.dto';

@Injectable()
export class LoginHistoryService {
  constructor(
    @InjectModel(LoginHistory.name)
    private readonly loginHistoryModel: Model<LoginHistoryDocument>,
  ) {}

  async create(data: {
    userId: string;
    type: 'login' | 'logout';
    ip: string;
    userAgent?: string;
    lat?: number;
    long?: number;
  }): Promise<LoginHistoryDocument> {
    const device = this.parseUserAgent(data.userAgent || '');
    const newLog = new this.loginHistoryModel({
      ...data,
      device,
      timestamp: new Date(),
    });
    return newLog.save();
  }

  async findAll(
    query: QueryLoginHistoryDto,
    forceUserId?: string,
  ): Promise<{ data: LoginHistoryDocument[]; total: number }> {
    const {
      userId,
      type,
      sortBy = 'timestamp',
      sortOrder = 'desc',
      page = 1,
      limit = 10,
    } = query;

    const filter: any = {};

    // Apply security boundary:
    // If a specific userId is forced, use it. Otherwise, if userId is passed (for admins), use it.
    if (forceUserId) {
      filter.userId = forceUserId;
    } else if (userId) {
      filter.userId = userId;
    }

    if (type) {
      filter.type = type;
    }

    const total = await this.loginHistoryModel.countDocuments(filter).exec();

    const sortDirection = sortOrder === 'asc' ? 1 : -1;
    const sortField = sortBy || 'timestamp';

    const queryChain = this.loginHistoryModel
      .find(filter)
      .populate('userId', 'firstName lastName email role')
      .sort({ [sortField]: sortDirection });

    if (limit > 0 && limit < 99999) {
      queryChain.skip((page - 1) * limit).limit(limit);
    }

    const data = await queryChain.exec();
    return { data, total };
  }

  private parseUserAgent(userAgent: string): string {
    if (!userAgent) return 'Unknown Device';
    
    let os = 'Unknown OS';
    let browser = 'Unknown Browser';

    // Parse OS
    if (/windows/i.test(userAgent)) {
      os = 'Windows';
    } else if (/macintosh|mac os x/i.test(userAgent)) {
      os = 'macOS';
    } else if (/iphone|ipad|ipod/i.test(userAgent)) {
      os = 'iOS';
    } else if (/android/i.test(userAgent)) {
      os = 'Android';
    } else if (/linux/i.test(userAgent)) {
      os = 'Linux';
    }

    // Parse Browser
    if (/chrome|crios/i.test(userAgent) && !/edge|edg/i.test(userAgent) && !/opr/i.test(userAgent)) {
      browser = 'Chrome';
    } else if (/safari/i.test(userAgent) && !/chrome|crios/i.test(userAgent)) {
      browser = 'Safari';
    } else if (/firefox|fxios/i.test(userAgent)) {
      browser = 'Firefox';
    } else if (/edge|edg/i.test(userAgent)) {
      browser = 'Edge';
    } else if (/opr/i.test(userAgent)) {
      browser = 'Opera';
    } else if (/trident/i.test(userAgent)) {
      browser = 'IE';
    }

    return `${browser} on ${os}`;
  }
}
