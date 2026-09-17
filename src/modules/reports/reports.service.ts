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
import { Lead, LeadDocument } from '../leads/schemas/lead.schema';
import { Opportunity, OpportunityDocument } from '../opportunities/schemas/opportunity.schema';
import { Property, PropertyDocument } from '../properties/schemas/property.schema';
import { Project, ProjectDocument } from '../projects/schemas/project.schema';
import { SiteVisit, SiteVisitDocument } from '../site-visits/schemas/site-visit.schema';
import { Contact, ContactDocument } from '../contacts/schemas/contact.schema';
import { generateExcelBuffer } from '../../common/utils/excel.util';

@Injectable()
export class ReportsService implements OnModuleInit {
  constructor(
    @InjectModel(ReportClass.name)
    private readonly reportModel: Model<ReportDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    private readonly activitiesService: ActivitiesService,
    @InjectModel(Lead.name)
    private readonly leadModel: Model<LeadDocument>,
    @InjectModel(Opportunity.name)
    private readonly opportunityModel: Model<OpportunityDocument>,
    @InjectModel(Property.name)
    private readonly propertyModel: Model<PropertyDocument>,
    @InjectModel(Project.name)
    private readonly projectModel: Model<ProjectDocument>,
    @InjectModel(SiteVisit.name)
    private readonly siteVisitModel: Model<SiteVisitDocument>,
    @InjectModel(Contact.name)
    private readonly contactModel: Model<ContactDocument>,
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
          description:
            'Monthly CRM Productivity Report provides an employee-wise snapshot of leads, follow-ups, calls, site visits, and lead sources, helping track daily performance, workload, and overall sales productivity across the CRM.',
          type: 'Adhoc Report',
          validity: 'Active',
          nextRun: 'On Demand',
          createdBy: userId as any,
        },
        {
          name: 'WEEKLY CRM PRODUCTIVITY REPORT',
          description:
            'Weekly CRM Productivity Report provides a weekly snapshot of employee sales efficiency, lead engagement, and task completion metrics.',
          type: 'Adhoc Report',
          validity: 'Active',
          nextRun: 'On Demand',
          createdBy: userId as any,
        },
        {
          name: 'DAILY CRM PRODUCTIVITY REPORT',
          description:
            'Daily CRM Productivity Report delivers real-time hourly analytics on calls made, site visits conducted, and lead statuses updated.',
          type: 'Adhoc Report',
          validity: 'Active',
          nextRun: 'On Demand',
          createdBy: userId as any,
        },
        {
          name: 'EMPLOYEE LEAD ACTIVE REPORT(LAST 7 DAYS)',
          description:
            'Details active leads assigned to employees over the last 7 calendar days with updates on ongoing deal opportunities.',
          type: 'Adhoc Report',
          validity: 'Active',
          nextRun: 'On Demand',
          createdBy: userId as any,
        },
        {
          name: 'TOTAL EMPLOYEE SUMMARY REPORT',
          description:
            'Consolidated report tracking employee profiles, attendance status, and overall lead ownership statistics.',
          type: 'Adhoc Report',
          validity: 'Active',
          nextRun: 'On Demand',
          createdBy: userId as any,
        },
        {
          name: 'DAILY EMPLOYEE SUMMARY REPORTS',
          description:
            'A day-end brief summarizing employee attendance, check-in times, task status, and system actions.',
          type: 'Adhoc Report',
          validity: 'Active',
          nextRun: 'On Demand',
          createdBy: userId as any,
        },
        {
          name: 'VISIT REPORT SUMMARY',
          description:
            'Logs customer site visits showing check-in location coordinates, feedback notes, and outcome statuses.',
          type: 'Adhoc Report',
          validity: 'Active',
          nextRun: 'On Demand',
          createdBy: userId as any,
        },
        {
          name: 'Sales Report 1',
          description:
            'Sales performance metrics report run on a monthly basis.',
          type: 'Monthly Report',
          validity: 'Active',
          nextRun: '01 Jul 2025 6:00 PM',
          createdBy: userId as any,
        },
        {
          name: 'DATA REPORT',
          description:
            'Export of system tables including leads, campaigns, and opportunities logs.',
          type: 'Adhoc Report',
          validity: 'Active',
          nextRun: 'On Demand',
          createdBy: userId as any,
        },
      ];

      await this.reportModel.insertMany(seedReports);
      console.log(
        '🌱 Successfully seeded initial Reports directory database collection.',
      );
    }
  }

  async create(
    createDto: CreateReportDto,
    userId?: string,
  ): Promise<ReportDocument> {
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
    const {
      type,
      validity,
      search,
      page = 1,
      limit = 10,
      sortBy = 'Create Date',
      orderBy = 'Desc',
    } = query;
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
    const report = await this.reportModel
      .findById(id)
      .populate('createdBy')
      .exec();
    if (!report) {
      throw new NotFoundException(`Report with ID "${id}" not found`);
    }
    return report;
  }

  async update(
    id: string,
    updateDto: UpdateReportDto,
    userId?: string,
  ): Promise<ReportDocument> {
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

  async uploadExcelToGoogleDrive(buffer: Buffer, fileName: string): Promise<any> {
    const clientId = process.env.GOOGLE_DRIVE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_DRIVE_CLIENT_SECRET;
    const refreshToken = process.env.GOOGLE_DRIVE_REFRESH_TOKEN;

    if (clientId && clientSecret && refreshToken) {
      try {
        const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            client_id: clientId,
            client_secret: clientSecret,
            refresh_token: refreshToken,
            grant_type: 'refresh_token',
          }),
        });

        if (!tokenResponse.ok) {
          const errText = await tokenResponse.text();
          throw new Error(`Google OAuth token refresh failed: ${errText}`);
        }

        const tokenData = (await tokenResponse.json()) as any;
        const accessToken = tokenData.access_token;

        const boundary = 'report_upload_boundary_12345';
        const metadata = {
          name: fileName,
          mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        };

        const header = [
          `--${boundary}`,
          'Content-Type: application/json; charset=UTF-8',
          '',
          JSON.stringify(metadata),
          `--${boundary}`,
          'Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          '',
          '',
        ].join('\r\n');
        const footer = `\r\n--${boundary}--\r\n`;

        const multipartBody = Buffer.concat([
          Buffer.from(header, 'utf-8'),
          buffer,
          Buffer.from(footer, 'utf-8'),
        ]);

        const uploadResponse = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': `multipart/related; boundary=${boundary}`,
          },
          body: multipartBody,
        });

        if (!uploadResponse.ok) {
          const errText = await uploadResponse.text();
          throw new Error(`Google Drive upload failed: ${errText}`);
        }

        const uploadData = (await uploadResponse.json()) as any;
        return {
          success: true,
          fileId: uploadData.id,
          fileName: uploadData.name,
          webViewLink: `https://drive.google.com/open?id=${uploadData.id}`,
          isMock: false,
        };
      } catch (err) {
        console.error('Real Google Drive upload failed, falling back to mock:', err);
      }
    }

    try {
      const fs = await import('fs');
      const path = await import('path');
      const backupsDir = path.join(process.cwd(), 'backups');
      if (!fs.existsSync(backupsDir)) {
        fs.mkdirSync(backupsDir, { recursive: true });
      }

      const backupFileName = `${fileName.replace('.xlsx', '')}_drive_${new Date().getTime()}.xlsx`;
      const filePath = path.join(backupsDir, backupFileName);
      fs.writeFileSync(filePath, buffer);

      const backendUrl = process.env.BACKEND_URL || 'http://localhost:3000';
      const downloadLink = `${backendUrl}/api/databackup/download/${backupFileName}`;

      return {
        success: true,
        message: 'Google Drive credentials not set in .env. Saved locally in backups folder instead.',
        fileName: backupFileName,
        webViewLink: downloadLink,
        isMock: true,
      };
    } catch (err: any) {
      console.error('Google Drive export simulation failed:', err);
      throw new Error(`Export to Google Drive failed: ${err.message}`);
    }
  }

  async getReportData(id: string): Promise<{ headers: string[]; rows: string[][]; reportName: string }> {
    const report = await this.findOne(id);
    const reportNameLower = report.name.toLowerCase();
    const userIds = report.permission
      ? report.permission.split(',').map((u) => u.trim()).filter(Boolean)
      : [];

    let headers: string[] = [];
    let rows: string[][] = [];

    if (reportNameLower.includes('lead')) {
      const query: any = {};
      if (userIds.length > 0) {
        query.$or = [
          { assignedTo: { $in: userIds } },
          { createdBy: { $in: userIds } },
        ];
      }
      const leads = await this.leadModel
        .find(query)
        .populate('contactId')
        .populate('assignedTo')
        .populate('createdBy')
        .exec();

      headers = [
        'Contact Name',
        'Contact Mobile',
        'Contact Email',
        'Requirement',
        'Follow-up Note',
        'Schedule Date',
        'Schedule Time',
        'Score',
        'Source',
        'Branch',
        'Assignee',
        'Temperature',
        'Status',
        'Next Remark',
        'Outcome',
        'Purpose',
        'Created At',
      ];

      rows = leads.map((l: any) => {
        const contactName = l.contactId
          ? `${l.contactId.firstName || ''} ${l.contactId.lastName || ''}`.trim()
          : '';
        const contactMobile = l.contactId?.mobile || '';
        const contactEmail = l.contactId?.email || '';
        const assigneeName = l.assignedTo
          ? `${l.assignedTo.firstName || ''} ${l.assignedTo.lastName || ''}`.trim()
          : '';
        return [
          contactName,
          contactMobile,
          contactEmail,
          l.requirement || '',
          l.followupNote || '',
          l.scheduleDate || '',
          l.scheduleTime || '',
          l.score !== undefined ? l.score.toString() : '1.0',
          l.source || '',
          l.branch || '',
          assigneeName,
          l.temperature || '',
          l.status || '',
          l.nextRemark || '',
          l.outcome || '',
          l.purpose || '',
          l.createdAt ? new Date(l.createdAt).toISOString() : '',
        ];
      });
    } else if (
      reportNameLower.includes('opportunity') ||
      reportNameLower.includes('opp')
    ) {
      const query: any = {};
      if (userIds.length > 0) {
        query.$or = [
          { assignedTo: { $in: userIds } },
          { createdBy: { $in: userIds } },
        ];
      }
      const opps = await this.opportunityModel
        .find(query)
        .populate('contactId')
        .populate('assignedTo')
        .populate('createdBy')
        .exec();

      headers = [
        'Customer Name',
        'Customer Mobile',
        'Customer Email',
        'Purpose',
        'Looking For',
        'Budget',
        'Area',
        'City',
        'Locality',
        'Bedroom',
        'Furnishing',
        'Next Stage',
        'Schedule Date',
        'Schedule Time',
        'Source',
        'Branch',
        'Assignee',
        'Est. Revenue',
        'Status',
        'Created At',
      ];

      rows = opps.map((o: any) => {
        const contactName = o.contactId
          ? `${o.contactId.firstName || ''} ${o.contactId.lastName || ''}`.trim()
          : '';
        const contactMobile = o.contactId?.mobile || '';
        const contactEmail = o.contactId?.email || '';
        const assigneeName = o.assignedTo
          ? `${o.assignedTo.firstName || ''} ${o.assignedTo.lastName || ''}`.trim()
          : '';
        const budgetStr = `${o.minBudget || 0}-${o.maxBudget || 0} ${o.budgetUnit || ''}`.trim();
        const areaStr = `${o.minArea || 0}-${o.maxArea || 0} ${o.areaUnit || ''}`.trim();
        return [
          contactName,
          contactMobile,
          contactEmail,
          o.purpose || '',
          o.lookingFor || '',
          budgetStr,
          areaStr,
          o.city || '',
          o.locality || '',
          o.bedroom || '',
          o.furnishing || '',
          o.schedulePurpose || '',
          o.scheduleDate || '',
          o.scheduleTime || '',
          o.source || '',
          o.branch || '',
          assigneeName,
          o.estRevenue !== undefined ? o.estRevenue.toString() : '0',
          o.status || '',
          o.createdAt ? new Date(o.createdAt).toISOString() : '',
        ];
      });
    } else if (reportNameLower.includes('property')) {
      const query: any = {};
      if (userIds.length > 0) {
        query.$or = [
          { assignedTo: { $in: userIds } },
          { createdBy: { $in: userIds } },
        ];
      }
      const props = await this.propertyModel
        .find(query)
        .populate('ownerLandlord')
        .populate('assignedTo')
        .populate('createdBy')
        .exec();

      headers = [
        'Property Name',
        'Location',
        'Type',
        'Price',
        'Sqft',
        'Status',
        'Builder',
        'Owner Name',
        'Owner Mobile',
        'Assignee',
        'Created At',
      ];

      rows = props.map((p: any) => {
        const ownerName = p.ownerLandlord
          ? `${p.ownerLandlord.firstName || ''} ${p.ownerLandlord.lastName || ''}`.trim()
          : '';
        const ownerMobile = p.ownerLandlord?.mobile || '';
        const assigneeName = p.assignedTo
          ? `${p.assignedTo.firstName || ''} ${p.assignedTo.lastName || ''}`.trim()
          : '';
        return [
          p.name || '',
          p.location || '',
          p.type || '',
          p.price !== undefined ? p.price.toString() : '',
          p.sqft !== undefined ? p.sqft.toString() : '',
          p.status || '',
          p.builder || '',
          ownerName,
          ownerMobile,
          assigneeName,
          p.createdAt ? new Date(p.createdAt).toISOString() : '',
        ];
      });
    } else if (reportNameLower.includes('project')) {
      const query: any = {};
      if (userIds.length > 0) {
        query.$or = [
          { assignedTo: { $in: userIds } },
          { createdBy: { $in: userIds } },
        ];
      }
      const projects = await this.projectModel
        .find(query)
        .populate('contactId')
        .populate('assignedTo')
        .populate('createdBy')
        .exec();

      headers = [
        'Project Name',
        'Project Owner',
        'Launch Date',
        'RERA Number',
        'Area',
        'Price',
        'Status',
        'Developer',
        'Assignee',
        'Created At',
      ];

      rows = projects.map((p: any) => {
        const ownerName = p.contactId
          ? `${p.contactId.firstName || ''} ${p.contactId.lastName || ''}`.trim()
          : '';
        const assigneeName = p.assignedTo
          ? `${p.assignedTo.firstName || ''} ${p.assignedTo.lastName || ''}`.trim()
          : '';
        const areaStr = `${p.projectArea || ''} ${p.areaUnit || ''}`.trim();
        return [
          p.projectName || '',
          ownerName,
          p.launchDate || '',
          p.reraNumber || '',
          areaStr,
          p.price !== undefined ? p.price.toString() : '',
          p.status || '',
          p.developerName || '',
          assigneeName,
          p.createdAt ? new Date(p.createdAt).toISOString() : '',
        ];
      });
    } else if (
      reportNameLower.includes('visit') ||
      reportNameLower.includes('sitevisit') ||
      reportNameLower.includes('sitevist')
    ) {
      const query: any = {};
      if (userIds.length > 0) {
        query.$or = [
          { assignee: { $in: userIds } },
          { createdBy: { $in: userIds } },
        ];
      }
      const siteVisits = await this.siteVisitModel
        .find(query)
        .populate('assignee')
        .populate('createdBy')
        .exec();

      headers = [
        'Visitor',
        'Visit Type',
        'Module',
        'Site Name',
        'Visit Date',
        'Time In',
        'Time Out',
        'Remark',
        'Site Manager',
        'Sourcing Manager',
        'Closing Manager',
        'Source',
        'Branch',
        'Assignee',
        'Visit Status',
        'Submitted By',
        'Created At',
      ];

      rows = siteVisits.map((sv: any) => {
        const assigneeName = sv.assignee
          ? `${sv.assignee.firstName || ''} ${sv.assignee.lastName || ''}`.trim()
          : '';
        const submittedBy = sv.createdBy
          ? `${sv.createdBy.firstName || ''} ${sv.createdBy.lastName || ''}`.trim()
          : '';
        return [
          sv.visitor || '',
          sv.visitType || '',
          sv.module || '',
          sv.siteName || '',
          sv.visitDate || '',
          sv.timeIn || '',
          sv.timeOut || '',
          sv.remark || '',
          sv.siteManager || '',
          sv.sourcingManager || '',
          sv.closingManager || '',
          sv.source || '',
          sv.branch || '',
          assigneeName,
          sv.visitStatus || '',
          submittedBy,
          sv.createdAt ? new Date(sv.createdAt).toISOString() : '',
        ];
      });
    } else {
      // Default: Contact / Customer Summary
      const query: any = {};
      if (userIds.length > 0) {
        query.$or = [
          { assignedTo: { $in: userIds } },
          { createdBy: { $in: userIds } },
        ];
      }
      const contacts = await this.contactModel
        .find(query)
        .populate('assignedTo')
        .populate('createdBy')
        .exec();

      headers = [
        'Customer Name',
        'Customer Type',
        'Contact Type',
        'Mobile',
        'Email',
        'DND Status',
        'Unique Number',
        'Address',
        'City',
        'Company',
        'Designation',
        'Source',
        'Branch',
        'Assignee',
        'Created At',
      ];

      rows = contacts.map((c: any) => {
        const contactName = `${c.firstName || ''} ${c.lastName || ''}`.trim();
        const assigneeName = c.assignedTo
          ? `${c.assignedTo.firstName || ''} ${c.assignedTo.lastName || ''}`.trim()
          : '';
        return [
          contactName,
          c.customerType || '',
          c.contactType || '',
          c.mobile || '',
          c.email || '',
          c.dndStatus || '',
          c.uniqueNumber || '',
          c.address || '',
          c.city || '',
          c.companyName || '',
          c.designation || '',
          c.source || '',
          c.branch || '',
          assigneeName,
          c.createdAt ? new Date(c.createdAt).toISOString() : '',
        ];
      });
    }

    return { headers, rows, reportName: report.name };
  }

  async generateReportExcel(id: string): Promise<{ buffer: Buffer; fileName: string; reportName: string }> {
    const { headers, rows, reportName } = await this.getReportData(id);
    const buffer = await generateExcelBuffer(reportName, headers, rows);

    let filePrefix = 'report';
    const reportNameLower = reportName.toLowerCase();
    if (reportNameLower.includes('lead')) {
      filePrefix = 'lead_report';
    } else if (reportNameLower.includes('opportunity') || reportNameLower.includes('opp')) {
      filePrefix = 'opportunity_report';
    } else if (reportNameLower.includes('property')) {
      filePrefix = 'property_report';
    } else if (reportNameLower.includes('project')) {
      filePrefix = 'project_report';
    } else if (reportNameLower.includes('visit') || reportNameLower.includes('sitevisit') || reportNameLower.includes('sitevist')) {
      filePrefix = 'site_visit_report';
    } else {
      filePrefix = 'customer_summary_report';
    }

    const fileName = `${filePrefix}_${new Date().toISOString().slice(0, 10)}.xlsx`;
    return { buffer, fileName, reportName };
  }
}
