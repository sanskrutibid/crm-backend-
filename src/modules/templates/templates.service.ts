import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Template, TemplateDocument } from './schemas/template.schema';
import { CreateTemplateDto } from './dto/create-template.dto';
import { UpdateTemplateDto } from './dto/update-template.dto';
import { QueryTemplateDto } from './dto/query-template.dto';
import { User, UserDocument } from '../users/schemas/user.schema';
import { ActivitiesService } from '../activities/activities.service';
import { ActivityType } from '../activities/schemas/activity.schema';

@Injectable()
export class TemplatesService implements OnModuleInit {
  constructor(
    @InjectModel(Template.name)
    private readonly templateModel: Model<TemplateDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    private readonly activitiesService: ActivitiesService,
  ) {}

  /**
   * Seed default templates on database initialization if the collection is empty.
   */
  async onModuleInit() {
    const count = await this.templateModel.countDocuments().exec();
    if (count === 0) {
      const defaultUser = await this.userModel.findOne().exec();
      if (defaultUser) {
        const initialTemplates: Partial<Template>[] = [
          {
            name: 'Customer Onboarding Welcome Email',
            templateId: 'welcome_email_v1',
            templateType: 'Email',
            layoutType: 'editor',
            editorContent:
              '<h3>Welcome to Vaultstone!</h3><p>Dear customer, we are excited to help you manage your CRM workflows. Let us know if you need anything.</p>',
            createdBy: defaultUser._id as any,
          },
          {
            name: 'Verification OTP SMS',
            templateId: 'otp_sms_verif',
            templateType: 'SMS',
            layoutType: 'editor',
            editorContent:
              'Your Vaultstone CRM verification code is 884729. Valid for 10 minutes.',
            createdBy: defaultUser._id as any,
          },
          {
            name: 'New Site Visit Scheduled Notification',
            templateId: 'site_visit_wa_v1',
            templateType: 'WhatsApp',
            layoutType: 'editor',
            editorContent:
              'Hello {{1}}, your site visit to {{2}} is scheduled for {{3}} at {{4}}. See you soon!',
            createdBy: defaultUser._id as any,
          },
          {
            name: 'Site Visit Scheduled SMS Notification',
            templateId: 'site_visit_sms_v1',
            templateType: 'SMS',
            layoutType: 'editor',
            editorContent:
              'Hello {{contactName}}, your site visit to {{siteName}} is scheduled for {{visitDate}} at {{timeIn}}.',
            createdBy: defaultUser._id as any,
          },
          {
            name: 'Site Visit Scheduled Email Notification',
            templateId: 'site_visit_email_v1',
            templateType: 'Email',
            layoutType: 'editor',
            editorContent:
              '<h3>Site Visit Scheduled</h3><p>Dear {{contactName}},</p><p>Your site visit to <strong>{{siteName}}</strong> has been scheduled for <strong>{{visitDate}}</strong> from <strong>{{timeIn}}</strong> to <strong>{{timeOut}}</strong>.</p><p>Remarks: {{remark}}</p><p>Thank you!</p>',
            createdBy: defaultUser._id as any,
          },
        ];

        await this.templateModel.insertMany(initialTemplates);
        console.log(
          '🌱 Successfully seeded initial Templates database collection.',
        );
      } else {
        console.log(
          '⚠️ No users found in database to assign seed Templates to. Seeding skipped.',
        );
      }
    }
  }

  async create(
    createDto: CreateTemplateDto,
    defaultUserId?: string,
  ): Promise<TemplateDocument> {
    const creator = createDto.createdBy || defaultUserId;
    const newTemplate = new this.templateModel({
      ...createDto,
      createdBy: creator,
    });
    const saved = await newTemplate.save();

    // Log the action
    await this.activitiesService.log(
      `Created new template "${saved.name}" (Type: "${saved.templateType}", Layout: "${saved.layoutType}")`,
      ActivityType.TEMPLATE,
      defaultUserId,
    );

    return saved.populate(['createdBy', 'updatedBy']);
  }

  async findAll(
    query: QueryTemplateDto,
  ): Promise<{ templates: TemplateDocument[]; total: number }> {
    const {
      search,
      keyword,
      templateType,
      layoutType,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = 1,
      limit = 10,
    } = query;

    const filter: any = {};
    const targetType = templateType || (query as any).type;
    if (targetType) {
      filter.templateType = new RegExp(`^${targetType}$`, 'i');
    }

    if (layoutType) {
      filter.layoutType = layoutType;
    }

    const textSearch = search || keyword;
    if (textSearch) {
      filter.$or = [
        { name: new RegExp(textSearch, 'i') },
        { templateId: new RegExp(textSearch, 'i') },
        { templateType: new RegExp(textSearch, 'i') },
      ];
    }

    const sortDirection = sortOrder === 'asc' ? 1 : -1;
    const sortOption: any = { [sortBy]: sortDirection };

    const total = await this.templateModel.countDocuments(filter).exec();

    const queryChain = this.templateModel
      .find(filter)
      .populate(['createdBy', 'updatedBy'])
      .sort(sortOption);

    if (limit && limit > 0 && limit < 99999) {
      queryChain.skip((page - 1) * limit).limit(limit);
    }

    const templates = await queryChain.exec();
    return { templates, total };
  }

  async findOne(id: string): Promise<TemplateDocument> {
    const template = await this.templateModel
      .findById(id)
      .populate(['createdBy', 'updatedBy'])
      .exec();

    if (!template) {
      throw new NotFoundException(`Template with ID "${id}" not found`);
    }

    return template;
  }

  async update(
    id: string,
    updateDto: UpdateTemplateDto,
    defaultUserId?: string,
  ): Promise<TemplateDocument> {
    const original = await this.templateModel.findById(id).exec();
    if (!original) {
      throw new NotFoundException(`Template with ID "${id}" not found`);
    }

    const updated = await this.templateModel
      .findByIdAndUpdate(
        id,
        {
          ...updateDto,
          updatedBy: defaultUserId,
        },
        { new: true },
      )
      .populate(['createdBy', 'updatedBy'])
      .exec();

    if (!updated) {
      throw new NotFoundException(`Template with ID "${id}" not found`);
    }

    // Log the action
    await this.activitiesService.log(
      `Modified template "${updated.name}" details (Type: "${updated.templateType}")`,
      ActivityType.TEMPLATE,
      defaultUserId,
    );

    return updated;
  }

  async remove(id: string, defaultUserId?: string): Promise<void> {
    const template = await this.templateModel.findById(id).exec();
    if (!template) {
      throw new NotFoundException(`Template with ID "${id}" not found`);
    }

    await this.templateModel.findByIdAndDelete(id).exec();

    // Log the action
    await this.activitiesService.log(
      `Deleted template "${template.name}"`,
      ActivityType.TEMPLATE,
      defaultUserId,
    );
  }
}
