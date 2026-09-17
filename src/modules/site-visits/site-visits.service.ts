import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { SiteVisit, SiteVisitDocument } from './schemas/site-visit.schema';
import { CreateSiteVisitDto } from './dto/create-site-visit.dto';
import { UpdateSiteVisitDto } from './dto/update-site-visit.dto';
import { QuerySiteVisitDto } from './dto/query-site-visit.dto';
import { Contact, ContactDocument } from '../contacts/schemas/contact.schema';
import { Lead, LeadDocument } from '../leads/schemas/lead.schema';
import { SmsService } from '../sms/sms.service';
import { EmailsService } from '../emails/emails.service';
import { ActivitiesService } from '../activities/activities.service';
import { ActivityType } from '../activities/schemas/activity.schema';
import { Template, TemplateDocument } from '../templates/schemas/template.schema';
import { GoogleCalendarService } from '../google-calendar/google-calendar.service';

@Injectable()
export class SiteVisitsService {
  constructor(
    @InjectModel(SiteVisit.name)
    private readonly siteVisitModel: Model<SiteVisitDocument>,
    @InjectModel(Contact.name)
    private readonly contactModel: Model<ContactDocument>,
    @InjectModel(Lead.name)
    private readonly leadModel: Model<LeadDocument>,
    @InjectModel(Template.name)
    private readonly templateModel: Model<TemplateDocument>,
    private readonly smsService: SmsService,
    private readonly emailsService: EmailsService,
    private readonly activitiesService: ActivitiesService,
    private readonly googleCalendarService: GoogleCalendarService,
  ) {}

  private replacePlaceholders(content: string, data: any): string {
    let result = content;
    result = result.replace(/\{\{contactName\}\}/g, data.contactName || '');
    result = result.replace(/\{\{visitor\}\}/g, data.visitor || '');
    result = result.replace(/\{\{visitType\}\}/g, data.visitType || '');
    result = result.replace(/\{\{module\}\}/g, data.module || '');
    result = result.replace(/\{\{siteName\}\}/g, data.siteName || '');
    result = result.replace(/\{\{otherName\}\}/g, data.otherName || '');
    result = result.replace(/\{\{visitDate\}\}/g, data.visitDate || '');
    result = result.replace(/\{\{timeIn\}\}/g, data.timeIn || '');
    result = result.replace(/\{\{timeOut\}\}/g, data.timeOut || '');
    result = result.replace(/\{\{remark\}\}/g, data.remark || '');
    result = result.replace(/\{\{siteManager\}\}/g, data.siteManager || '');
    result = result.replace(/\{\{sourcingManager\}\}/g, data.sourcingManager || '');
    result = result.replace(/\{\{closingManager\}\}/g, data.closingManager || '');
    result = result.replace(/\{\{source\}\}/g, data.source || '');
    result = result.replace(/\{\{branch\}\}/g, data.branch || '');
    result = result.replace(/\{\{visitStatus\}\}/g, data.visitStatus || '');

    result = result.replace(/\{\{1\}\}/g, data.contactName || '');
    result = result.replace(/\{\{2\}\}/g, data.siteName || '');
    result = result.replace(/\{\{3\}\}/g, data.visitDate || '');
    result = result.replace(/\{\{4\}\}/g, data.timeIn || '');
    return result;
  }

  async create(
    createDto: CreateSiteVisitDto,
    defaultUserId?: string,
  ): Promise<SiteVisitDocument> {
    const assignee = createDto.assignee || defaultUserId;
    const createdBy = createDto.createdBy || defaultUserId;

    let otp: string | null = null;
    let otpExpiresAt: Date | null = null;
    if (createDto.sendSmsNotification || createDto.sendEmailNotification) {
      otp = Math.floor(100000 + Math.random() * 900000).toString();
      otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    }

    const newVisit = new this.siteVisitModel({
      ...createDto,
      assignee,
      createdBy,
      otp,
      otpExpiresAt,
    });
    const saved = await newVisit.save();

    // Sync with Google Calendar asynchronously
    this.googleCalendarService.syncEventForSiteVisit(saved._id.toString()).catch(err => {
      console.error('Google Calendar sync failed for site visit creation:', err);
    });

    // Sync site visit with Lead if leadId is provided
    if (createDto.leadId) {
      try {
        const lead = await this.leadModel.findById(createDto.leadId).exec();
        if (lead) {
          if (!lead.siteVisits) {
            lead.siteVisits = [];
          }
          lead.siteVisits.push({
            visitor: createDto.visitor,
            visitType: createDto.visitType,
            module: createDto.module,
            siteName: createDto.siteName,
            otherName: createDto.otherName,
            visitDate: createDto.visitDate,
            timeIn: createDto.timeIn,
            timeOut: createDto.timeOut,
            remark: createDto.remark,
            siteManager: createDto.siteManager,
            sourcingManager: createDto.sourcingManager,
            closingManager: createDto.closingManager,
            source: createDto.source,
            branch: createDto.branch,
            assignee: String(assignee),
            visitStatus: createDto.visitStatus,
            sendSmsNotification: createDto.sendSmsNotification === true,
            sendEmailNotification: createDto.sendEmailNotification === true,
            visibility: createDto.isPrivate ? 'Private' : 'Branch',
            photograph: createDto.photograph,
            createdAt: new Date(),
          });
          await lead.save();
        }
      } catch (err) {
        console.error('Failed to sync site visit to lead subdocuments list:', err);
      }
    }

    // Retrieve contact details to trigger SMS and/or Email notification
    let contactId = createDto.contactId;
    if (!contactId && createDto.leadId) {
      try {
        const lead = await this.leadModel.findById(createDto.leadId).exec();
        if (lead && lead.contactId) {
          if (typeof lead.contactId === 'object') {
            contactId = (lead.contactId as any)._id
              ? String((lead.contactId as any)._id)
              : lead.contactId.toString();
          } else {
            contactId = String(lead.contactId);
          }
        }
      } catch (err) {
        console.error('Failed to retrieve contact from lead:', err);
      }
    }

    // Try to parse name and mobile from visitor field (Name : Mobile) as a fallback
    let parsedMobile: string | null = null;
    let parsedName = createDto.visitor;
    if (createDto.visitor && createDto.visitor.includes(':')) {
      const parts = createDto.visitor.split(':');
      parsedName = parts[0].trim();
      const rawMobile = parts[1].trim();
      if (rawMobile && rawMobile.toLowerCase() !== 'no mobile') {
        parsedMobile = rawMobile;
      }
    }

    let visitorMobile = parsedMobile || '';
    let visitorEmail = '';
    let visitorName = parsedName;

    if (contactId) {
      try {
        const contact = await this.contactModel.findById(contactId).exec();
        if (contact) {
          visitorMobile = contact.mobile || visitorMobile;
          visitorEmail = contact.email || '';
          visitorName = `${contact.firstName} ${contact.lastName || ''}`.trim() || visitorName;
        }
      } catch (err) {
        console.error('Failed to retrieve contact details for site visit:', err);
      }
    }

    const placeholderData = {
      contactName: visitorName,
      visitor: createDto.visitor,
      visitType: createDto.visitType,
      module: createDto.module,
      siteName: createDto.siteName || '',
      otherName: createDto.otherName || '',
      visitDate: createDto.visitDate,
      timeIn: createDto.timeIn,
      timeOut: createDto.timeOut,
      remark: createDto.remark || '',
      siteManager: createDto.siteManager || '',
      sourcingManager: createDto.sourcingManager || '',
      closingManager: createDto.closingManager || '',
      source: createDto.source || '',
      branch: createDto.branch || '',
      visitStatus: createDto.visitStatus || '',
    };

    try {
      // Send SMS if requested
      if (createDto.sendSmsNotification && visitorMobile) {
        const parsedMobiles = visitorMobile.replace(/[^\d+]/g, '');
        let combinedMobile = parsedMobiles;
        if (!combinedMobile.startsWith('+')) {
          if (/^\d{10}$/.test(combinedMobile)) {
            combinedMobile = `+91${combinedMobile}`;
          } else if (/^\d{12}$/.test(combinedMobile) && combinedMobile.startsWith('91')) {
            combinedMobile = `+${combinedMobile}`;
          } else if (/^\d+$/.test(combinedMobile)) {
            combinedMobile = `+${combinedMobile}`;
          }
        }

        let smsMessage = `Hello ${visitorName}, your site visit to ${createDto.siteName || ''} (${createDto.otherName || ''}) has been scheduled on ${createDto.visitDate} from ${createDto.timeIn} to ${createDto.timeOut}.\nVisit Type: ${createDto.visitType}\nStatus: ${createDto.visitStatus}\nSite Manager: ${createDto.siteManager || ''}\nRemarks: ${createDto.remark || ''}`;
        try {
          const smsTemplate = await this.templateModel.findOne({
            templateType: 'SMS',
            $or: [
              { templateId: 'site_visit_sms_v1' },
              { name: new RegExp('site visit', 'i') }
            ]
          }).exec();
          if (smsTemplate) {
            const rawContent = smsTemplate.editorContent || smsTemplate.fileContent || '';
            if (rawContent) {
              smsMessage = this.replacePlaceholders(rawContent, placeholderData);
            }
          }
        } catch (err) {
          console.error('Error fetching SMS template from DB:', err);
        }

        await this.smsService.schedule({
          mobiles: combinedMobile,
          message: otp ? `${smsMessage}\nVerification OTP: ${otp}. This OTP is valid for 10 minutes.` : smsMessage,
          createdBy: createdBy && String(createdBy) !== 'undefined' ? String(createdBy) : undefined,
        });
      }

      // Send Email if requested
      if (createDto.sendEmailNotification && visitorEmail) {
        let emailSubject = `Site Visit Scheduled - ${createDto.siteName || ''}`;
        let emailBody = `<h3>Site Visit Scheduled</h3>
<p>Dear ${visitorName},</p>
<p>Your site visit has been scheduled. Details are below:</p>
<table border="1" cellpadding="5" style="border-collapse: collapse;">
  <tr><td><strong>Visitor Name:</strong></td><td>${createDto.visitor}</td></tr>
  <tr><td><strong>Visit Type:</strong></td><td>${createDto.visitType}</td></tr>
  <tr><td><strong>Site Name:</strong></td><td>${createDto.siteName || 'N/A'}</td></tr>
  <tr><td><strong>Other Name:</strong></td><td>${createDto.otherName || 'N/A'}</td></tr>
  <tr><td><strong>Visit Date:</strong></td><td>${createDto.visitDate}</td></tr>
  <tr><td><strong>Time In:</strong></td><td>${createDto.timeIn}</td></tr>
  <tr><td><strong>Time Out:</strong></td><td>${createDto.timeOut}</td></tr>
  <tr><td><strong>Remark:</strong></td><td>${createDto.remark || 'N/A'}</td></tr>
  <tr><td><strong>Site Manager:</strong></td><td>${createDto.siteManager || 'N/A'}</td></tr>
  <tr><td><strong>Sourcing Manager:</strong></td><td>${createDto.sourcingManager || 'N/A'}</td></tr>
  <tr><td><strong>Closing Manager:</strong></td><td>${createDto.closingManager || 'N/A'}</td></tr>
  <tr><td><strong>Source:</strong></td><td>${createDto.source || 'N/A'}</td></tr>
  <tr><td><strong>Branch:</strong></td><td>${createDto.branch || 'N/A'}</td></tr>
  <tr><td><strong>Visit Status:</strong></td><td>${createDto.visitStatus || 'N/A'}</td></tr>
</table>
<br/>
<p>Thank you!</p>`;

        try {
          const emailTemplate = await this.templateModel.findOne({
            templateType: 'Email',
            $or: [
              { templateId: 'site_visit_email_v1' },
              { name: new RegExp('site visit', 'i') }
            ]
          }).exec();
          if (emailTemplate) {
            const rawContent = emailTemplate.editorContent || emailTemplate.fileContent || '';
            if (rawContent) {
              emailBody = this.replacePlaceholders(rawContent, placeholderData);
              emailSubject = emailTemplate.name || emailSubject;
            }
          }
        } catch (err) {
          console.error('Error fetching Email template from DB:', err);
        }

        await this.emailsService.schedule({
          to: visitorEmail.trim(),
          subject: emailSubject,
          body: otp ? `${emailBody}<br/><p><strong>Verification OTP:</strong> ${otp}</p><p>This OTP is valid for 10 minutes.</p>` : emailBody,
          createdBy: createdBy && String(createdBy) !== 'undefined' ? String(createdBy) : undefined,
        });
      }
    } catch (err) {
      console.error('Failed to schedule SMS or Email notification for site visit:', err);
    }

    // Log the action
    await this.activitiesService.log(
      `Scheduled site visit for visitor "${saved.visitor}" to "${saved.siteName || 'N/A'}" on ${saved.visitDate} | Visit Status: "${saved.visitStatus}"`,
      ActivityType.SITE_VISIT,
      defaultUserId,
    );

    return saved.populate(['assignee', 'createdBy', 'contactId']);
  }

  async findAll(
    query: QuerySiteVisitDto,
  ): Promise<{ siteVisits: SiteVisitDocument[]; total: number }> {
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
      throw new NotFoundException(
        `Site visit record with ID "${id}" not found`,
      );
    }

    return visit;
  }

  async update(
    id: string,
    updateDto: UpdateSiteVisitDto,
    defaultUserId?: string,
  ): Promise<SiteVisitDocument> {
    const original = await this.siteVisitModel.findById(id).exec();
    if (!original) {
      throw new NotFoundException(
        `Site visit record with ID "${id}" not found`,
      );
    }

    const updated = await this.siteVisitModel
      .findByIdAndUpdate(id, updateDto, { new: true })
      .populate(['assignee', 'createdBy', 'contactId'])
      .exec();

    if (updated) {
      // Sync with Google Calendar asynchronously
      this.googleCalendarService.syncEventForSiteVisit(updated._id.toString()).catch(err => {
        console.error('Google Calendar sync failed for site visit update:', err);
      });
    }

    if (!updated) {
      throw new NotFoundException(
        `Site visit record with ID "${id}" not found`,
      );
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
      throw new NotFoundException(
        `Site visit record with ID "${id}" not found`,
      );
    }

    if (visit.googleEventId && visit.assignee) {
      this.googleCalendarService.deleteEvent(visit.assignee.toString(), visit.googleEventId).catch(err => {
        console.error('Google Calendar event deletion failed for site visit:', err);
      });
    }

    await this.siteVisitModel.findByIdAndDelete(id).exec();

    // Log the action
    await this.activitiesService.log(
      `Deleted site visit for visitor "${visit.visitor}" (Site: "${visit.siteName || 'N/A'}")`,
      ActivityType.SITE_VISIT,
      defaultUserId,
    );
  }

  async verifyOtp(id: string, otp: string): Promise<{ success: boolean; message: string }> {
    const visit = await this.siteVisitModel.findById(id).exec();
    if (!visit) {
      throw new NotFoundException('Site Visit record not found');
    }

    if (!visit.otp) {
      throw new BadRequestException('No active OTP found for this site visit');
    }

    if (visit.otpExpiresAt && new Date() > visit.otpExpiresAt) {
      throw new BadRequestException('OTP has expired. Please update the visit to trigger a new one.');
    }

    if (visit.otp !== otp) {
      throw new BadRequestException('Invalid OTP. Please check and try again.');
    }

    visit.visitStatus = 'Completed';
    visit.otp = undefined;
    visit.otpExpiresAt = undefined;
    await visit.save();

    // Sync status change with Lead if applicable
    if (visit.leadId) {
      try {
        const lead = await this.leadModel.findById(visit.leadId).exec();
        if (lead && lead.siteVisits) {
          const match = lead.siteVisits.find(sv => sv.visitDate === visit.visitDate && sv.timeIn === visit.timeIn);
          if (match) {
            match.visitStatus = 'Completed';
            await lead.save();
          }
        }
      } catch (err) {
        console.error('Failed to sync completed status to lead:', err);
      }
    }

    return { success: true, message: 'OTP verified successfully. Site Visit completed.' };
  }
}
