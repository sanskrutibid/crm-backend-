import {
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Email, EmailDocument } from './schemas/email.schema';
import { ScheduleEmailDto } from './dto/schedule-email.dto';
import { QueryEmailDto } from './dto/query-email.dto';

@Injectable()
export class EmailsService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(EmailsService.name);
  private schedulerInterval: NodeJS.Timeout | null = null;

  constructor(
    @InjectModel(Email.name)
    private readonly emailModel: Model<EmailDocument>,
    private readonly configService: ConfigService,
  ) {}

  onModuleInit() {
    this.logger.log('✉️ Initializing Scheduled Emails Polling Loop...');
    this.schedulerInterval = setInterval(() => {
      this.processScheduledEmails().catch((err) => {
        this.logger.error('Error in scheduled email polling loop:', err);
      });
    }, 30000); // Polling every 30 seconds
  }

  onModuleDestroy() {
    if (this.schedulerInterval) {
      clearInterval(this.schedulerInterval);
      this.logger.log('✉️ Cleared Scheduled Emails Polling Loop.');
    }
  }

  /**
   * Parse recipients list from comma-separated string or array
   */
  private parseRecipients(recipients: string | string[]): string[] {
    if (Array.isArray(recipients)) {
      return recipients.map((r) => r.trim()).filter(Boolean);
    }
    if (typeof recipients === 'string') {
      return recipients
        .split(',')
        .map((r) => r.trim())
        .filter(Boolean);
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

    const time = timeStr ? timeStr.trim().toLowerCase() : '00:00';
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
    const dmyMatch = dateStr.match(
      /^(\d{1,2})-(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)-(\d{4})$/i,
    );
    const dmySlashMatch = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);

    if (ymdMatch) {
      year = parseInt(ymdMatch[1], 10);
      month = parseInt(ymdMatch[2], 10) - 1;
      day = parseInt(ymdMatch[3], 10);
    } else if (dmyMatch) {
      day = parseInt(dmyMatch[1], 10);
      year = parseInt(dmyMatch[3], 10);
      const months = [
        'jan',
        'feb',
        'mar',
        'apr',
        'may',
        'jun',
        'jul',
        'aug',
        'sep',
        'oct',
        'nov',
        'dec',
      ];
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
    // Construct ISO string with +05:30 timezone offset
    const isoString = `${year}-${pad(month + 1)}-${pad(day)}T${pad(hours)}:${pad(minutes)}:00+05:30`;
    const finalDate = new Date(isoString);

    if (isNaN(finalDate.getTime())) {
      return new Date();
    }
    return finalDate;
  }

  /**
   * Create new scheduled email record
   */
  async schedule(dto: ScheduleEmailDto): Promise<EmailDocument> {
    const to = this.parseRecipients(dto.to);
    const cc = dto.cc ? this.parseRecipients(dto.cc) : [];
    const bcc = dto.bcc ? this.parseRecipients(dto.bcc) : [];

    const scheduleTime = this.parseScheduleDateTime(
      dto.scheduleDate,
      dto.scheduleTime,
    );

    const newEmail = new this.emailModel({
      to,
      cc,
      bcc,
      subject: dto.subject,
      body: dto.body,
      scheduleTime,
      status: 'Pending',
      createdBy: dto.createdBy,
    });

    const saved = await newEmail.save();
    this.logger.log(
      `✉️ Email scheduled with ID ${saved._id} for ${scheduleTime.toISOString()}`,
    );

    // If scheduled for immediate send (scheduleTime is now or in the past), run asynchronously
    if (scheduleTime <= new Date()) {
      this.sendEmail(saved).catch((err) => {
        this.logger.error(`Failed to send immediate email ${saved._id}:`, err);
      });
    }

    return saved;
  }

  /**
   * Fetch all emails matching filter parameters for reporting
   */
  async findAll(
    query: QueryEmailDto,
  ): Promise<{ emails: EmailDocument[]; total: number }> {
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
        { subject: new RegExp(textSearch, 'i') },
        { to: new RegExp(textSearch, 'i') },
      ];
    }

    const sortDirection = sortOrder === 'asc' ? 1 : -1;
    const sortOption: any = { [sortBy]: sortDirection };

    const total = await this.emailModel.countDocuments(filter).exec();

    const queryChain = this.emailModel
      .find(filter)
      .populate('createdBy')
      .sort(sortOption);

    if (limit && limit > 0) {
      queryChain.skip((page - 1) * limit).limit(limit);
    }

    const emails = await queryChain.exec();
    return { emails, total };
  }

  /**
   * Fetch details of a single email
   */
  async findOne(id: string): Promise<EmailDocument> {
    const email = await this.emailModel
      .findById(id)
      .populate('createdBy')
      .exec();
    if (!email) {
      throw new NotFoundException(`Email record with ID "${id}" not found`);
    }
    return email;
  }

  /**
   * Main scheduler poller: process pending emails
   */
  async processScheduledEmails() {
    const now = new Date();
    const pendingEmails = await this.emailModel
      .find({
        status: 'Pending',
        scheduleTime: { $lte: now },
      })
      .exec();

    if (pendingEmails.length === 0) {
      return;
    }

    this.logger.log(
      `✉️ Found ${pendingEmails.length} pending scheduled email(s) to send.`,
    );
    for (const email of pendingEmails) {
      await this.sendEmail(email);
    }
  }

  /**
   * Send single email via SMTP
   */
  async sendEmail(email: EmailDocument) {
    const gmailUser = this.configService.get<string>('GMAIL_USER');
    const gmailAppPassword =
      this.configService.get<string>('GMAIL_APP_PASSWORD');
    const fromName =
      this.configService.get<string>('MAIL_FROM_NAME') || 'VaultStone CRM';
    const backendUrl =
      this.configService.get<string>('BACKEND_URL') || 'http://localhost:3000';

    if (!gmailUser || !gmailAppPassword) {
      this.logger.warn(
        '⚠️ SMTP settings are missing GMAIL_USER or GMAIL_APP_PASSWORD. Email sending will fail.',
      );
      email.status = 'Failed';
      email.errorMessage = 'SMTP configuration is incomplete in .env';
      await email.save();
      return;
    }

    // Append 1x1 transparent tracking pixel image at the end of body
    const trackingPixel = `<img src="${backendUrl}/api/v1/emails/track/${email._id}" width="1" height="1" style="display:none;" />`;
    let finalBody = email.body;
    if (finalBody.includes('</body>')) {
      finalBody = finalBody.replace('</body>', `${trackingPixel}</body>`);
    } else {
      finalBody = finalBody + trackingPixel;
    }

    try {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: gmailUser,
          pass: gmailAppPassword,
        },
      });

      const mailOptions = {
        from: `"${fromName}" <${gmailUser}>`,
        to: email.to.join(', '),
        cc: email.cc && email.cc.length > 0 ? email.cc.join(', ') : undefined,
        bcc:
          email.bcc && email.bcc.length > 0 ? email.bcc.join(', ') : undefined,
        subject: email.subject,
        html: finalBody,
      };

      await transporter.sendMail(mailOptions);

      email.status = 'Sent';
      email.sentAt = new Date();
      await email.save();

      this.logger.log(
        `✉️ Successfully sent email ID ${email._id} to ${email.to.join(', ')}`,
      );
    } catch (err: any) {
      this.logger.error(`❌ Failed to send email ID ${email._id}:`, err);
      email.status = 'Failed';
      email.errorMessage = err.message || 'Unknown SMTP error';
      await email.save();
    }
  }

  /**
   * Log email open tracking event
   */
  async trackOpen(id: string, ip: string, userAgent: string) {
    try {
      const email = await this.emailModel.findById(id).exec();
      if (!email) {
        return;
      }

      email.openCount += 1;
      email.opens.push({
        openedAt: new Date(),
        ip: ip || 'unknown',
        userAgent: userAgent || 'unknown',
      });

      await email.save();
      this.logger.log(
        `✉️ Email ID ${id} opened. Total opens: ${email.openCount}`,
      );
    } catch (err) {
      this.logger.error(`Failed to track open for email ID ${id}:`, err);
    }
  }
}
