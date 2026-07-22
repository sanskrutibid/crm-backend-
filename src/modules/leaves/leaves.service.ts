import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Leave, LeaveDocument } from './schemas/leave.schema';
import { CreateLeaveDto } from './dto/create-leave.dto';
import { UpdateLeaveStatusDto, LeaveStatus } from './dto/update-leave-status.dto';
import { QueryLeaveDto } from './dto/query-leave.dto';
import { CalculateLeaveDto } from './dto/calculate-leave.dto';
import { EmailsService } from '../emails/emails.service';

@Injectable()
export class LeavesService {
  private readonly logger = new Logger(LeavesService.name);

  constructor(
    @InjectModel(Leave.name) private readonly leaveModel: Model<LeaveDocument>,
    private readonly emailsService: EmailsService,
  ) {}

  /**
   * Helper method to calculate leave days between two dates
   */
  calculateDays(startDateStr: string | Date, endDateStr: string | Date, isHalfDay?: boolean): number {
    if (isHalfDay) {
      return 0.5;
    }

    const start = new Date(startDateStr);
    const end = new Date(endDateStr);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new BadRequestException('Invalid start or end date provided.');
    }

    if (end < start) {
      throw new BadRequestException('End date cannot be prior to start date.');
    }

    // Set times to midnight to calculate full calendar day difference
    const startUtc = Date.UTC(start.getFullYear(), start.getMonth(), start.getDate());
    const endUtc = Date.UTC(end.getFullYear(), end.getMonth(), end.getDate());

    const diffMs = endUtc - startUtc;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1;

    return Math.max(0.5, diffDays);
  }

  /**
   * Public endpoint helper to calculate leave days
   */
  async calculateLeave(dto: CalculateLeaveDto) {
    const totalDays = this.calculateDays(dto.startDate, dto.endDate, dto.isHalfDay);
    return {
      startDate: dto.startDate,
      endDate: dto.endDate,
      isHalfDay: !!dto.isHalfDay,
      totalDays,
    };
  }

  /**
   * Apply / Add a new leave request
   */
  async create(createLeaveDto: CreateLeaveDto): Promise<LeaveDocument> {
    const totalDays = this.calculateDays(
      createLeaveDto.startDate,
      createLeaveDto.endDate,
      createLeaveDto.isHalfDay,
    );

    const leaveData: Partial<Leave> = {
      employeeId: createLeaveDto.employeeId,
      employeeName: createLeaveDto.employeeName,
      employeeEmail: createLeaveDto.employeeEmail,
      leaveType: createLeaveDto.leaveType || 'Casual Leave',
      startDate: new Date(createLeaveDto.startDate),
      endDate: new Date(createLeaveDto.endDate),
      totalDays,
      isHalfDay: createLeaveDto.isHalfDay || false,
      halfDaySession: createLeaveDto.halfDaySession || 'Full Day',
      reason: createLeaveDto.reason,
      status: 'Pending',
      appliedOn: new Date(),
    };

    if (createLeaveDto.employee && Types.ObjectId.isValid(createLeaveDto.employee)) {
      leaveData.employee = new Types.ObjectId(createLeaveDto.employee);
    }

    const createdLeave = new this.leaveModel(leaveData);
    const savedLeave = await createdLeave.save();

    this.logger.log(`Leave request created for ${savedLeave.employeeName} (${savedLeave.employeeId})`);
    return savedLeave;
  }

  /**
   * Fetch all leaves with filtering and pagination
   */
  async findAll(query: QueryLeaveDto) {
    const {
      employeeId,
      status,
      leaveType,
      search,
      startDate,
      endDate,
      page = 1,
      limit = 10,
    } = query;

    const filter: any = {};

    if (employeeId) {
      if (Types.ObjectId.isValid(employeeId)) {
        filter.$or = [
          { employeeId: employeeId },
          { employee: new Types.ObjectId(employeeId) },
        ];
      } else {
        filter.employeeId = employeeId;
      }
    }

    if (status) {
      filter.status = status;
    }

    if (leaveType) {
      filter.leaveType = leaveType;
    }

    if (startDate || endDate) {
      filter.startDate = {};
      if (startDate) {
        filter.startDate.$gte = new Date(startDate);
      }
      if (endDate) {
        const endRange = new Date(endDate);
        endRange.setHours(23, 59, 59, 999);
        filter.startDate.$lte = endRange;
      }
    }

    if (search) {
      const searchRegEx = new RegExp(search, 'i');
      filter.$and = filter.$and || [];
      filter.$and.push({
        $or: [
          { employeeName: searchRegEx },
          { employeeId: searchRegEx },
          { reason: searchRegEx },
          { leaveType: searchRegEx },
        ],
      });
    }

    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 10;
    const skip = (pageNum - 1) * limitNum;

    const total = await this.leaveModel.countDocuments(filter).exec();
    const leaves = await this.leaveModel
      .find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .exec();

    const totalPages = Math.ceil(total / limitNum) || 1;

    return {
      leaves,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages,
    };
  }

  /**
   * Fetch leave details by ID
   */
  async findOne(id: string): Promise<LeaveDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException(`Invalid Leave ID "${id}"`);
    }

    const leave = await this.leaveModel.findById(id).exec();
    if (!leave) {
      throw new NotFoundException(`Leave record with ID "${id}" not found`);
    }
    return leave;
  }

  /**
   * Approve or Decline leave request & send email notification
   */
  async updateStatus(
    id: string,
    updateLeaveStatusDto: UpdateLeaveStatusDto,
  ): Promise<LeaveDocument> {
    const leave = await this.findOne(id);

    leave.status = updateLeaveStatusDto.status;
    leave.actionBy = updateLeaveStatusDto.actionBy || 'Admin';
    leave.actionReason = updateLeaveStatusDto.actionReason || '';
    leave.actionDate = new Date();

    const updatedLeave = await leave.save();

    // Trigger email notification if status is Approved or Declined
    if (
      updateLeaveStatusDto.status === LeaveStatus.APPROVED ||
      updateLeaveStatusDto.status === LeaveStatus.DECLINED
    ) {
      this.sendLeaveNotificationEmail(updatedLeave).catch((err) => {
        this.logger.error(
          `Failed to send leave status email for leave ID ${updatedLeave._id}:`,
          err,
        );
      });
    }

    return updatedLeave;
  }

  /**
   * Get leave metrics and summary counts
   */
  async getLeaveStats(employeeId?: string) {
    const filter: any = {};
    if (employeeId) {
      if (Types.ObjectId.isValid(employeeId)) {
        filter.$or = [
          { employeeId: employeeId },
          { employee: new Types.ObjectId(employeeId) },
        ];
      } else {
        filter.employeeId = employeeId;
      }
    }

    const allLeaves = await this.leaveModel.find(filter).exec();

    const stats = {
      totalRequests: allLeaves.length,
      pending: 0,
      approved: 0,
      declined: 0,
      cancelled: 0,
      totalDaysApproved: 0,
    };

    for (const l of allLeaves) {
      if (l.status === 'Pending') stats.pending++;
      else if (l.status === 'Approved') {
        stats.approved++;
        stats.totalDaysApproved += l.totalDays || 0;
      } else if (l.status === 'Declined') stats.declined++;
      else if (l.status === 'Cancelled') stats.cancelled++;
    }

    return stats;
  }

  /**
   * Remove / Cancel leave record
   */
  async remove(id: string) {
    const leave = await this.findOne(id);
    await this.leaveModel.findByIdAndDelete(id).exec();
    return { success: true, message: 'Leave record deleted successfully', id };
  }

  /**
   * Construct and send professional HTML email notification to employee
   */
  private async sendLeaveNotificationEmail(leave: LeaveDocument) {
    if (!leave.employeeEmail) {
      this.logger.warn(`No recipient email available for Leave ID ${leave._id}`);
      return;
    }

    const isApproved = leave.status === 'Approved';
    const statusColor = isApproved ? '#10B981' : '#EF4444';
    const statusText = isApproved ? 'APPROVED' : 'DECLINED';

    const startDateStr = new Date(leave.startDate).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
    const endDateStr = new Date(leave.endDate).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

    const subject = `Leave Request ${statusText}: ${leave.leaveType} (${startDateStr} to ${endDateStr})`;

    const htmlBody = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9fafb; border-radius: 8px; border: 1px solid #e5e7eb; overflow: hidden;">
        <div style="background-color: #1e293b; padding: 24px; text-align: center;">
          <h2 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 600;">VaultStone CRM</h2>
          <p style="color: #94a3b8; margin: 4px 0 0 0; font-size: 14px;">Leave Application Status Update</p>
        </div>
        
        <div style="padding: 24px; background-color: #ffffff;">
          <p style="font-size: 16px; color: #1f2937; margin-top: 0;">Dear <strong>${leave.employeeName}</strong>,</p>
          <p style="font-size: 15px; color: #4b5563; line-height: 1.5;">
            Your leave request has been reviewed by <strong>${leave.actionBy || 'Management'}</strong>. Please find the details below:
          </p>

          <div style="margin: 20px 0; padding: 16px; background-color: #f8fafc; border-left: 4px solid ${statusColor}; border-radius: 4px;">
            <div style="display: inline-block; padding: 4px 12px; border-radius: 9999px; background-color: ${statusColor}; color: #ffffff; font-weight: 700; font-size: 12px; letter-spacing: 0.5px; margin-bottom: 12px;">
              ${statusText}
            </div>
            
            <table style="width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 14px; color: #374151;">
              <tr>
                <td style="padding: 6px 0; color: #6b7280; width: 40%;"><strong>Employee ID:</strong></td>
                <td style="padding: 6px 0;">${leave.employeeId}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #6b7280;"><strong>Leave Type:</strong></td>
                <td style="padding: 6px 0;">${leave.leaveType}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #6b7280;"><strong>Duration:</strong></td>
                <td style="padding: 6px 0;">${startDateStr} to ${endDateStr} (${leave.totalDays} day${leave.totalDays > 1 ? 's' : ''})</td>
              </tr>
              ${leave.isHalfDay ? `
              <tr>
                <td style="padding: 6px 0; color: #6b7280;"><strong>Half Day Session:</strong></td>
                <td style="padding: 6px 0;">${leave.halfDaySession || 'Half Day'}</td>
              </tr>` : ''}
              <tr>
                <td style="padding: 6px 0; color: #6b7280;"><strong>Reason Applied:</strong></td>
                <td style="padding: 6px 0;">${leave.reason}</td>
              </tr>
              ${leave.actionReason ? `
              <tr>
                <td style="padding: 6px 0; color: #6b7280;"><strong>Reviewer Remark:</strong></td>
                <td style="padding: 6px 0;"><em>"${leave.actionReason}"</em></td>
              </tr>` : ''}
            </table>
          </div>

          <p style="font-size: 14px; color: #6b7280; margin-bottom: 0;">
            If you have any questions, please contact your HR or Manager.
          </p>
        </div>

        <div style="background-color: #f1f5f9; padding: 16px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b;">
          This is an automated email notification from VaultStone CRM Leave Module. Please do not reply directly to this email.
        </div>
      </div>
    `;

    await this.emailsService.schedule({
      to: leave.employeeEmail,
      subject,
      body: htmlBody,
      createdBy: leave.actionBy || 'Admin',
    });

    this.logger.log(`✉️ Sent leave status notification email to ${leave.employeeEmail} for leave ${leave._id}`);
  }
}
