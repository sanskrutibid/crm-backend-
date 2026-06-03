import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ReportClass, ReportDocument } from './schemas/report.schema';
import { CreateReportDto } from './dto/create-report.dto';
import { UpdateReportDto } from './dto/update-report.dto';
import { QueryReportDto } from './dto/query-report.dto';
import { User, UserDocument } from '../users/schemas/user.schema';
import { ActivitiesService } from '../activities/activities.service';
import { ActivityType } from '../activities/schemas/activity.schema';

@Injectable()
export class ReportsService implements OnModuleInit {
  constructor(
    @InjectModel(ReportClass.name)
    private readonly reportModel: Model<ReportDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    private readonly activitiesService: ActivitiesService,
  ) {}

  /**
   * Seed default reports shown in screenshots if collection is empty
   */
  async onModuleInit() {
    const count = await this.reportModel.countDocuments().exec();
    if (count === 0) {
      const defaultUser = await this.userModel.findOne().exec();
      const userId = defaultUser ? defaultUser._id : undefined;

      const seedReports: Partial<ReportClass>[] = [
        {
          name: 'MONTHLY CRM PRODUCTIVITY REPORT',
          description: 'Monthly CRM Productivity Report provides an employee-wise snapshot of leads, follow-ups, calls, site visits, and lead sources, helping track daily performance, workload, and overall sales productivity across the CRM.',
          type: 'Adhoc Report',
          validity: 'Active',
          nextRun: 'On Demand',
          createdBy: userId as any,
        },
        {
          name: 'WEEKLY CRM PRODUCTIVITY REPORT',
          description: 'Weekly CRM Productivity Report provides a weekly snapshot of employee sales efficiency, lead engagement, and task completion metrics.',
          type: 'Adhoc Report',
          validity: 'Active',
          nextRun: 'On Demand',
          createdBy: userId as any,
        },
        {
          name: 'DAILY CRM PRODUCTIVITY REPORT',
          description: 'Daily CRM Productivity Report delivers real-time hourly analytics on calls made, site visits conducted, and lead statuses updated.',
          type: 'Adhoc Report',
          validity: 'Active',
          nextRun: 'On Demand',
          createdBy: userId as any,
        },
        {
          name: 'EMPLOYEE LEAD ACTIVE REPORT(LAST 7 DAYS)',
          description: 'Details active leads assigned to employees over the last 7 calendar days with updates on ongoing deal opportunities.',
          type: 'Adhoc Report',
          validity: 'Active',
          nextRun: 'On Demand',
          createdBy: userId as any,
        },
        {
          name: 'TOTAL EMPLOYEE SUMMARY REPORT',
          description: 'Consolidated report tracking employee profiles, attendance status, and overall lead ownership statistics.',
          type: 'Adhoc Report',
          validity: 'Active',
          nextRun: 'On Demand',
          createdBy: userId as any,
        },
        {
          name: 'DAILY EMPLOYEE SUMMARY REPORTS',
          description: 'A day-end brief summarizing employee attendance, check-in times, task status, and system actions.',
          type: 'Adhoc Report',
          validity: 'Active',
          nextRun: 'On Demand',
          createdBy: userId as any,
        },
        {
          name: 'VISIT REPORT SUMMARY',
          description: 'Logs customer site visits showing check-in location coordinates, feedback notes, and outcome statuses.',
          type: 'Adhoc Report',
          validity: 'Active',
          nextRun: 'On Demand',
          createdBy: userId as any,
        },
        {
          name: 'Sales Report 1',
          description: 'Sales performance metrics report run on a monthly basis.',
          type: 'Monthly Report',
          validity: 'Active',
          nextRun: '01 Jul 2025 6:00 PM',
          createdBy: userId as any,
        },
        {
          name: 'DATA REPORT',
          description: 'Export of system tables including leads, campaigns, and opportunities logs.',
          type: 'Adhoc Report',
          validity: 'Active',
          nextRun: 'On Demand',
          createdBy: userId as any,
        },
      ];

      await this.reportModel.insertMany(seedReports);
      console.log('🌱 Successfully seeded initial Reports directory database collection.');
    }
  }

  async create(createDto: CreateReportDto, userId?: string): Promise<ReportDocument> {
    const docData: any = { ...createDto };

    // Auto-calculate next run based on type
    if (!createDto.nextRun) {
      if (createDto.type.toLowerCase().includes('adhoc')) {
        docData.nextRun = 'On Demand';
      } else if (createDto.type.toLowerCase().includes('monthly')) {
        docData.nextRun = '01 Jul 2025 6:00 PM'; // Matches screenshot Sales Report 1 run
      } else {
        docData.nextRun = 'Scheduled';
      }
    }

    if (userId) {
      docData.createdBy = userId;
    }

    const newReport = new this.reportModel(docData);
    const saved = await newReport.save();

    await this.activitiesService.log(
      `Created new report config: "${saved.name}" [Type: ${saved.type}]`,
      ActivityType.REPORT,
      userId,
    );

    return saved.populate('createdBy');
  }

  async findAll(
    query: QueryReportDto,
  ): Promise<{ reports: ReportDocument[]; total: number }> {
    const { type, validity, search, page = 1, limit = 10, sortBy = 'Create Date', orderBy = 'Desc' } = query;
    const filter: any = {};

    if (type) {
      filter.type = type;
    }

    if (validity) {
      filter.validity = validity;
    }

    if (search) {
      filter.$or = [
        { name: new RegExp(search, 'i') },
        { description: new RegExp(search, 'i') },
      ];
    }

    const total = await this.reportModel.countDocuments(filter).exec();

    // Map sort parameter to schema fields
    const dir: 1 | -1 = orderBy === 'Asc' ? 1 : -1;
    const sortFieldMap: Record<string, string> = {
      'Create Date': 'createdAt',
      Name: 'name',
      Type: 'type',
    };
    const sortField = sortFieldMap[sortBy] || 'createdAt';
    const sortObj = { [sortField]: dir };

    let queryChain = this.reportModel.find(filter).sort(sortObj);

    if (limit > 0 && limit < 99999) {
      queryChain = queryChain.skip((page - 1) * limit).limit(limit);
    }

    const reports = await queryChain.populate('createdBy').exec();

    return { reports, total };
  }

  async findOne(id: string): Promise<ReportDocument> {
    const report = await this.reportModel.findById(id).populate('createdBy').exec();
    if (!report) {
      throw new NotFoundException(`Report with ID "${id}" not found`);
    }
    return report;
  }

  async update(id: string, updateDto: UpdateReportDto, userId?: string): Promise<ReportDocument> {
    const updated = await this.reportModel
      .findByIdAndUpdate(id, updateDto, { new: true })
      .populate('createdBy')
      .exec();

    if (!updated) {
      throw new NotFoundException(`Report with ID "${id}" not found`);
    }

    await this.activitiesService.log(
      `Modified report config details for: "${updated.name}"`,
      ActivityType.REPORT,
      userId,
    );

    return updated;
  }

  async remove(id: string, userId?: string): Promise<void> {
    const report = await this.reportModel.findById(id).exec();
    if (!report) {
      throw new NotFoundException(`Report with ID "${id}" not found`);
    }

    await this.reportModel.findByIdAndDelete(id).exec();

    await this.activitiesService.log(
      `Deleted report configuration: "${report.name}"`,
      ActivityType.REPORT,
      userId,
    );
  }
}
