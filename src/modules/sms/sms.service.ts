import { Injectable, Logger, NotFoundException, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import { Twilio } from 'twilio';
import { Sms, SmsDocument } from './schemas/sms.schema';
import { ScheduleSmsDto } from './dto/schedule-sms.dto';
import { QuerySmsDto } from './dto/query-sms.dto';

@Injectable()
export class SmsService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(SmsService.name);
  private schedulerInterval: NodeJS.Timeout | null = null;

  constructor(
    @InjectModel(Sms.name)
    private readonly smsModel: Model<SmsDocument>,
    private readonly configService: ConfigService,
  ) {}

  onModuleInit() {
    this.logger.log('📱 Initializing Scheduled SMS Polling Loop...');
    this.schedulerInterval = setInterval(() => {
      this.processScheduledSms().catch(err => {
        this.logger.error('Error in scheduled SMS polling loop:', err);
      });
    }, 30000); // Polling every 30 seconds
  }

  onModuleDestroy() {
    if (this.schedulerInterval) {
      clearInterval(this.schedulerInterval);
      this.logger.log('📱 Cleared Scheduled SMS Polling Loop.');
    }
  }

  /**
   * Parse mobiles list from comma-separated string or array
   */
  private parseMobiles(mobiles: string | string[]): string[] {
    if (Array.isArray(mobiles)) {
      return mobiles.map(m => m.trim()).filter(Boolean);
    }
    if (typeof mobiles === 'string') {
      return mobiles.split(',').map(m => m.trim()).filter(Boolean);
    }
    return [];
  }

  /**
   * Parse date and time strings and construct a Date object forced to Indian Standard Time (IST, UTC+05:30)
   */
  private parseScheduleDateTime(dateStr?: string, timeStr?: string): Date {
    if (!dateStr) {
      return new Date();
    }

    let time = timeStr ? timeStr.trim().toLowerCase() : '00:00';
    let hours = 0;
    let minutes = 0;

    const ampmMatch = time.match(/^(\d{1,2}):(\d{2})\s*(am|pm)$/i);
    const militaryMatch = time.match(/^(\d{1,2}):(\d{2})$/);

    if (ampmMatch) {
      hours = parseInt(ampmMatch[1], 10);
      minutes = parseInt(ampmMatch[2], 10);
      const ampm = ampmMatch[3].toLowerCase();
      if (ampm === 'pm' && hours < 12) {
        hours += 12;
      } else if (ampm === 'am' && hours === 12) {
        hours = 0;
      }
    } else if (militaryMatch) {
      hours = parseInt(militaryMatch[1], 10);
      minutes = parseInt(militaryMatch[2], 10);
    } else {
      const digits = time.match(/(\d+)/g);
      if (digits && digits.length >= 2) {
        hours = parseInt(digits[0], 10);
        minutes = parseInt(digits[1], 10);
        if (time.includes('pm') && hours < 12) {
          hours += 12;
        } else if (time.includes('am') && hours === 12) {
          hours = 0;
        }
      }
    }

    let year = 0;
    let month = 0;
    let day = 0;

    const ymdMatch = dateStr.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    const dmyMatch = dateStr.match(/^(\d{1,2})-(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)-(\d{4})$/i);
    const dmySlashMatch = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);

    if (ymdMatch) {
      year = parseInt(ymdMatch[1], 10);
      month = parseInt(ymdMatch[2], 10) - 1;
      day = parseInt(ymdMatch[3], 10);
    } else if (dmyMatch) {
      day = parseInt(dmyMatch[1], 10);
      year = parseInt(dmyMatch[3], 10);
      const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
      month = months.indexOf(dmyMatch[2].toLowerCase());
      if (month === -1) month = 0;
    } else if (dmySlashMatch) {
      day = parseInt(dmySlashMatch[1], 10);
      month = parseInt(dmySlashMatch[2], 10) - 1;
      year = parseInt(dmySlashMatch[3], 10);
    } else {
      const parsedDate = new Date(dateStr);
      if (!isNaN(parsedDate.getTime())) {
        year = parsedDate.getFullYear();
        month = parsedDate.getMonth();
        day = parsedDate.getDate();
      } else {
        const today = new Date();
        year = today.getFullYear();
        month = today.getMonth();
        day = today.getDate();
      }
    }

    const pad = (num: number) => String(num).padStart(2, '0');
    const isoString = `${year}-${pad(month + 1)}-${pad(day)}T${pad(hours)}:${pad(minutes)}:00+05:30`;
    const finalDate = new Date(isoString);

    if (isNaN(finalDate.getTime())) {
      return new Date();
    }
    return finalDate;
  }

  /**
   * Create and schedule SMS record
   */
  async schedule(dto: ScheduleSmsDto): Promise<SmsDocument> {
    const mobiles = this.parseMobiles(dto.mobiles);
    const scheduleTime = this.parseScheduleDateTime(dto.scheduleDate, dto.scheduleTime);

    const newSms = new this.smsModel({
      mobiles,
      message: dto.message,
      dltTemplateId: dto.dltTemplateId,
      route: dto.route,
      scheduleTime,
      status: 'Pending',
      createdBy: dto.createdBy,
    });

    const saved = await newSms.save();
    this.logger.log(`📱 SMS scheduled with ID ${saved._id} for ${scheduleTime.toISOString()}`);

    // If scheduled for immediate send (scheduleTime is now or in the past), run asynchronously
    if (scheduleTime <= new Date()) {
      this.sendSms(saved).catch(err => {
        this.logger.error(`Failed to send immediate SMS ${saved._id}:`, err);
      });
    }

    return saved;
  }

  /**
   * Fetch all SMS reports
   */
  async findAll(query: QuerySmsDto): Promise<{ smsReports: SmsDocument[]; total: number }> {
    const {
      search,
      keyword,
      status,
      sortBy = 'scheduleTime',
      sortOrder = 'desc',
      page = 1,
      limit = 10,
    } = query;

    const filter: any = {};

    if (status) {
      filter.status = status;
    }

    const textSearch = search || keyword;
    if (textSearch) {
      filter.$or = [
        { message: new RegExp(textSearch, 'i') },
        { mobiles: new RegExp(textSearch, 'i') },
      ];
    }

    const sortDirection = sortOrder === 'asc' ? 1 : -1;
    const sortOption: any = { [sortBy]: sortDirection };

    const total = await this.smsModel.countDocuments(filter).exec();

    const queryChain = this.smsModel
      .find(filter)
      .populate('createdBy')
      .sort(sortOption);

    if (limit && limit > 0) {
      queryChain.skip((page - 1) * limit).limit(limit);
    }

    const smsReports = await queryChain.exec();
    return { smsReports, total };
  }

  /**
   * Fetch a single SMS report
   */
  async findOne(id: string): Promise<SmsDocument> {
    const sms = await this.smsModel.findById(id).populate('createdBy').exec();
    if (!sms) {
      throw new NotFoundException(`SMS report with ID "${id}" not found`);
    }
    return sms;
  }

  /**
   * Process all pending scheduled SMS
   */
  async processScheduledSms() {
    const now = new Date();
    const pendingSms = await this.smsModel
      .find({
        status: 'Pending',
        scheduleTime: { $lte: now },
      })
      .exec();

    if (pendingSms.length === 0) {
      return;
    }

    this.logger.log(`📱 Found ${pendingSms.length} pending scheduled SMS to send.`);
    for (const sms of pendingSms) {
      await this.sendSms(sms);
    }
  }

  /**
   * Send SMS via Twilio API
   */
  async sendSms(sms: SmsDocument) {
    const accountSid = this.configService.get<string>('TWILIO_ACCOUNT_SID') || this.configService.get<string>('TWILIO_SID');
    const authToken = this.configService.get<string>('TWILIO_AUTH_TOKEN');
    const fromNumber = this.configService.get<string>('TWILIO_PHONE_NUMBER') || '+1234567890';

    if (!accountSid || !authToken) {
      this.logger.warn('⚠️ Twilio credentials TWILIO_SID/TWILIO_ACCOUNT_SID or TWILIO_AUTH_TOKEN are missing in .env. SMS will fail.');
      sms.status = 'Failed';
      sms.errorMessage = 'Twilio credentials are not configured in .env';
      await sms.save();
      return;
    }

    try {
      const client = new Twilio(accountSid, authToken);

      this.logger.log(`📱 Dispatching SMS ID ${sms._id} to ${sms.mobiles.length} recipients...`);

      // Dispatch to all numbers concurrently
      const results = await Promise.allSettled(
        sms.mobiles.map(mobile =>
          client.messages.create({
            body: sms.message,
            from: fromNumber,
            to: mobile,
          }),
        ),
      );

      const messageSids: string[] = [];
      const errors: string[] = [];

      for (const res of results) {
        if (res.status === 'fulfilled') {
          messageSids.push(res.value.sid);
        } else {
          errors.push(res.reason.message || 'Unknown Twilio error');
        }
      }

      sms.messageSids = messageSids;
      sms.sentAt = new Date();

      if (messageSids.length > 0) {
        sms.status = 'Sent';
        if (errors.length > 0) {
          sms.errorMessage = `Partial failure. Errors: ${errors.join('; ')}`;
        }
        this.logger.log(`📱 SMS ID ${sms._id} sent. Sids: ${messageSids.join(', ')}`);
      } else {
        sms.status = 'Failed';
        sms.errorMessage = errors.join('; ') || 'All Twilio SMS transmissions failed';
        this.logger.error(`❌ Failed to send SMS ID ${sms._id}. Errors: ${sms.errorMessage}`);
      }

      await sms.save();
    } catch (err: any) {
      this.logger.error(`❌ Unexpected error sending SMS ID ${sms._id}:`, err);
      sms.status = 'Failed';
      sms.errorMessage = err.message || 'Unexpected SMS sending error';
      await sms.save();
    }
  }
}
