import {
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Holiday, HolidayDocument } from './schemas/holiday.schema';
import { Employee, EmployeeDocument } from '../employees/schemas/employee.schema';
import { User, UserDocument } from '../users/schemas/user.schema';
import { EmailsService } from '../emails/emails.service';
import { CreateHolidayDto } from './dto/create-holiday.dto';
import { UpdateHolidayDto } from './dto/update-holiday.dto';

@Injectable()
export class HolidaysService {
  private readonly logger = new Logger(HolidaysService.name);

  constructor(
    @InjectModel(Holiday.name)
    private readonly holidayModel: Model<HolidayDocument>,
    @InjectModel(Employee.name)
    private readonly employeeModel: Model<EmployeeDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    private readonly emailsService: EmailsService,
  ) {}

  private normalizePayload(dto: CreateHolidayDto | UpdateHolidayDto) {
    return {
      name: dto.name || dto.holidayName || '',
      date: dto.date || dto.holidayDate || '',
      day: dto.day || '',
      type: dto.type || dto.holidayType || 'National Holiday',
      applicableFor: dto.applicableFor || 'All Employees',
      description: dto.description || '',
      status: dto.status || 'Active',
      notifyEmployees: dto.notifyEmployees !== undefined ? dto.notifyEmployees : true,
    };
  }

  async create(createHolidayDto: CreateHolidayDto): Promise<{ success: boolean; message: string; holiday: HolidayDocument }> {
    const data = this.normalizePayload(createHolidayDto);
    if (!data.name || !data.date) {
      throw new Error('Holiday name and date are required.');
    }

    if (!data.day && data.date) {
      const dateObj = new Date(data.date);
      if (!isNaN(dateObj.getTime())) {
        data.day = dateObj.toLocaleDateString('en-US', { weekday: 'long' });
      }
    }

    const createdHoliday = new this.holidayModel(data);
    const savedHoliday = await createdHoliday.save();

    this.logger.log(`🎉 Holiday "${savedHoliday.name}" created on date ${savedHoliday.date}`);

    if (savedHoliday.notifyEmployees) {
      this.sendHolidayEmailNotificationToEmployees(savedHoliday).catch((err) => {
        this.logger.error(`Error sending holiday notification email: ${err.message}`, err);
      });
    }

    return {
      success: true,
      message: `Holiday "${savedHoliday.name}" created successfully.`,
      holiday: savedHoliday,
    };
  }

  async findAll(query: {
    search?: string;
    type?: string;
    status?: string;
    year?: string;
    page?: number;
    limit?: number;
  }): Promise<{ holidays: HolidayDocument[]; total: number }> {
    const filter: any = {};

    if (query.search) {
      filter.$or = [
        { name: { $regex: query.search, $options: 'i' } },
        { description: { $regex: query.search, $options: 'i' } },
      ];
    }

    if (query.type && query.type !== 'All') {
      filter.type = query.type;
    }

    if (query.status && query.status !== 'All') {
      filter.status = query.status;
    }

    if (query.year) {
      filter.date = { $regex: `^${query.year}` };
    }

    const total = await this.holidayModel.countDocuments(filter);
    const limit = Number(query.limit) || 100;
    const page = Number(query.page) || 1;
    const skip = (page - 1) * limit;

    const holidays = await this.holidayModel
      .find(filter)
      .sort({ date: 1 })
      .skip(skip)
      .limit(limit)
      .exec();

    return { holidays, total };
  }

  async findOne(id: string): Promise<HolidayDocument> {
    const holiday = await this.holidayModel.findById(id).exec();
    if (!holiday) {
      throw new NotFoundException(`Holiday with ID ${id} not found.`);
    }
    return holiday;
  }

  async update(
    id: string,
    updateHolidayDto: UpdateHolidayDto,
  ): Promise<{ success: boolean; message: string; holiday: HolidayDocument }> {
    const data = this.normalizePayload(updateHolidayDto);
    if (data.date && !data.day) {
      const dateObj = new Date(data.date);
      if (!isNaN(dateObj.getTime())) {
        data.day = dateObj.toLocaleDateString('en-US', { weekday: 'long' });
      }
    }

    const updatedHoliday = await this.holidayModel
      .findByIdAndUpdate(id, data, { new: true })
      .exec();

    if (!updatedHoliday) {
      throw new NotFoundException(`Holiday with ID ${id} not found.`);
    }

    if (updatedHoliday.notifyEmployees) {
      this.sendHolidayEmailNotificationToEmployees(updatedHoliday).catch((err) => {
        this.logger.error(`Error sending holiday update email: ${err.message}`, err);
      });
    }

    return {
      success: true,
      message: `Holiday "${updatedHoliday.name}" updated successfully.`,
      holiday: updatedHoliday,
    };
  }

  async remove(id: string): Promise<{ success: boolean; message: string }> {
    const res = await this.holidayModel.findByIdAndDelete(id).exec();
    if (!res) {
      throw new NotFoundException(`Holiday with ID ${id} not found.`);
    }
    return { success: true, message: 'Holiday deleted successfully.' };
  }

  async getCounts(): Promise<{ total: number; active: number; inactive: number }> {
    const total = await this.holidayModel.countDocuments();
    const active = await this.holidayModel.countDocuments({ status: 'Active' });
    const inactive = total - active;

    return { total, active, inactive };
  }

  /**
   * Dispatches email notifications to all employees for a holiday
   */
  async sendHolidayEmailNotificationToEmployees(holiday: any): Promise<{ success: boolean; count: number; recipients: string[] }> {
    const recipientsSet = new Set<string>();

    // 1. Fetch employee emails from Employee schema
    const employees = await this.employeeModel.find().exec();
    for (const emp of employees) {
      if (emp.officialEmail && emp.officialEmail.includes('@')) {
        recipientsSet.add(emp.officialEmail.trim().toLowerCase());
      }
      if (emp.personalEmail && emp.personalEmail.includes('@')) {
        recipientsSet.add(emp.personalEmail.trim().toLowerCase());
      }
    }

    // 2. Fetch user emails from User schema
    const users = await this.userModel.find().exec();
    for (const u of users) {
      if (u.email && u.email.includes('@')) {
        recipientsSet.add(u.email.trim().toLowerCase());
      }
    }

    const recipientEmails = Array.from(recipientsSet);

    if (recipientEmails.length === 0) {
      this.logger.warn(`⚠️ No employee email addresses found in database to notify for holiday: ${holiday.name}`);
      return { success: false, count: 0, recipients: [] };
    }

    const holidayName = holiday.name || holiday.holidayName || 'Official Holiday';
    const holidayDate = holiday.date || holiday.holidayDate || '';
    const holidayDay = holiday.day || '';
    const holidayType = holiday.type || holiday.holidayType || 'Holiday Announcement';
    const description = holiday.description || '';
    const applicableFor = holiday.applicableFor || 'All Employees';

    const subject = `🎉 Holiday Notice: ${holidayName} on ${holidayDate} (${holidayDay})`;

    const emailBodyHtml = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f6f9; padding: 30px 15px;">
        <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.08);">
          <!-- Header banner -->
          <div style="background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%); padding: 35px 25px; text-align: center; color: #ffffff;">
            <h1 style="margin: 0; font-size: 26px; font-weight: 700; letter-spacing: 0.5px;">Vaultstone CRM</h1>
            <p style="margin: 8px 0 0 0; font-size: 15px; opacity: 0.9;">Official Holiday Announcement</p>
          </div>

          <!-- Body content -->
          <div style="padding: 30px 25px;">
            <div style="text-align: center; margin-bottom: 25px;">
              <span style="display: inline-block; background-color: #e8f0fe; color: #1a73e8; padding: 6px 16px; border-radius: 20px; font-size: 13px; font-weight: 600; text-transform: uppercase;">
                ${holidayType}
              </span>
              <h2 style="color: #2c3e50; font-size: 24px; margin: 15px 0 10px 0;">🎉 ${holidayName}</h2>
            </div>

            <!-- Details Card -->
            <div style="background-color: #f8f9fa; border-left: 4px solid #1a73e8; padding: 20px; border-radius: 6px; margin-bottom: 25px;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #5f6368; font-size: 14px; width: 120px;"><strong>📅 Date:</strong></td>
                  <td style="padding: 8px 0; color: #202124; font-size: 14px; font-weight: 600;">${holidayDate} (${holidayDay})</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #5f6368; font-size: 14px;"><strong>👥 Applicable For:</strong></td>
                  <td style="padding: 8px 0; color: #202124; font-size: 14px;">${applicableFor}</td>
                </tr>
                ${
                  description
                    ? `<tr>
                        <td style="padding: 8px 0; color: #5f6368; font-size: 14px; vertical-align: top;"><strong>📝 Description:</strong></td>
                        <td style="padding: 8px 0; color: #202124; font-size: 14px;">${description}</td>
                      </tr>`
                    : ''
                }
              </table>
            </div>

            <p style="color: #4a5568; font-size: 15px; line-height: 1.6; margin-bottom: 20px;">
              Dear Team,<br/><br/>
              Please take note of the upcoming holiday detailed above. We wish you and your loved ones a wonderful time!
            </p>

            <div style="margin-top: 30px; border-top: 1px solid #edf2f7; padding-top: 20px; color: #718096; font-size: 13px; text-align: center;">
              Warm Regards,<br/>
              <strong>Management Team</strong><br/>
              Vaultstone CRM
            </div>
          </div>

          <!-- Footer -->
          <div style="background-color: #f7fafc; padding: 15px; text-align: center; font-size: 12px; color: #a0aec0;">
            This is an automated notification. Please do not reply directly to this email.
          </div>
        </div>
      </div>
    `;

    // Schedule / Send via EmailsService
    await this.emailsService.schedule({
      to: recipientEmails.join(', '),
      subject,
      body: emailBodyHtml,
    });

    this.logger.log(
      `📧 Holiday notification email dispatched to ${recipientEmails.length} employees for "${holidayName}".`,
    );

    return {
      success: true,
      count: recipientEmails.length,
      recipients: recipientEmails,
    };
  }
}
