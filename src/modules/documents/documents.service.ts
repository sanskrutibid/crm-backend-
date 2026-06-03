import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { DocumentClass, DocumentClassDocument } from './schemas/document.schema';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';
import { QueryDocumentDto } from './dto/query-document.dto';
import { User, UserDocument } from '../users/schemas/user.schema';
import { ActivitiesService } from '../activities/activities.service';
import { ActivityType } from '../activities/schemas/activity.schema';

@Injectable()
export class DocumentsService implements OnModuleInit {
  constructor(
    @InjectModel(DocumentClass.name)
    private readonly documentModel: Model<DocumentClassDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    private readonly activitiesService: ActivitiesService,
  ) {}

  /**
   * Seed default documents and legal templates if empty
   */
  async onModuleInit() {
    const count = await this.documentModel.countDocuments().exec();
    if (count === 0) {
      const defaultUser = await this.userModel.findOne().exec();
      if (defaultUser) {
        const seedDocs: Partial<DocumentClass>[] = [
          // General Documents
          {
            type: 'General',
            title: 'Project Details',
            description: 'Comprehensive overview details and specs of current real estate ventures.',
            rating: 78.5,
            fileUrl: 'uploads/documents/project_details.pdf',
            folder: 'Project Brochures',
            branch: 'Global Team',
            assignee: defaultUser._id as any,
            createdBy: defaultUser._id as any,
            isPublic: true,
          },
          {
            type: 'General',
            title: 'Lower Ground Floor Plan',
            description: 'Engineering blueprint drawing showing space layout of lower ground parking.',
            rating: 90.0,
            fileUrl: 'uploads/documents/lower_ground_plan.png',
            folder: 'Blueprints',
            branch: 'Global Team',
            assignee: defaultUser._id as any,
            createdBy: defaultUser._id as any,
            isPublic: true,
          },
          // Legal Templates
          {
            type: 'Legal',
            title: 'Notice by purchaser for specific performance of an agreement',
            description: 'Standard legal template notice to request specific performance of real estate purchase agreement.',
            rating: 85.0,
            fileUrl: 'uploads/documents/legal/notice_specific_performance.pdf',
            folder: 'Legal Notices',
            branch: 'Global Team',
            assignee: defaultUser._id as any,
            createdBy: defaultUser._id as any,
            isPublic: true,
          },
          {
            type: 'Legal',
            title: 'Special Power of Attorney',
            description: 'Legal authorization format allowing representation for property transactions.',
            rating: 82.3,
            fileUrl: 'uploads/documents/legal/special_poa.pdf',
            folder: 'Power of Attorney',
            branch: 'Global Team',
            assignee: defaultUser._id as any,
            createdBy: defaultUser._id as any,
            isPublic: true,
          },
          {
            type: 'Legal',
            title: 'Appointment of Proxy',
            description: 'Form to delegate voting or representational authority in building societies/association meetings.',
            rating: 74.0,
            fileUrl: 'uploads/documents/legal/appointment_of_proxy.pdf',
            folder: 'Corporate Templates',
            branch: 'Global Team',
            assignee: defaultUser._id as any,
            createdBy: defaultUser._id as any,
            isPublic: true,
          },
          {
            type: 'Legal',
            title: 'Form No. 25 on Rs. 20/- Stamp Paper',
            description: 'Declaration affidavit format printed on standard stamp paper.',
            rating: 88.5,
            fileUrl: 'uploads/documents/legal/form_25_stamp.pdf',
            folder: 'Affidavits',
            branch: 'Global Team',
            assignee: defaultUser._id as any,
            createdBy: defaultUser._id as any,
            isPublic: true,
          },
          {
            type: 'Legal',
            title: 'Certificate Of Title',
            description: 'Official template format to certify clear and marketable ownership title of land/flats.',
            rating: 95.0,
            fileUrl: 'uploads/documents/legal/certificate_of_title.pdf',
            folder: 'Titles & Ownership',
            branch: 'Global Team',
            assignee: defaultUser._id as any,
            createdBy: defaultUser._id as any,
            isPublic: true,
          },
          {
            type: 'Legal',
            title: 'Power of Attorney',
            description: 'General power of attorney template covering administration and management of asset properties.',
            rating: 80.0,
            fileUrl: 'uploads/documents/legal/general_poa.pdf',
            folder: 'Power of Attorney',
            branch: 'Global Team',
            assignee: defaultUser._id as any,
            createdBy: defaultUser._id as any,
            isPublic: true,
          },
          {
            type: 'Legal',
            title: 'Agreement to Sell & Purchase (Flats)',
            description: 'Standard blueprint contract formatting terms and conditions of purchase for multi-family flat units.',
            rating: 98.4,
            fileUrl: 'uploads/documents/legal/agreement_sell_purchase_flats.pdf',
            folder: 'Contracts',
            branch: 'Global Team',
            assignee: defaultUser._id as any,
            createdBy: defaultUser._id as any,
            isPublic: true,
          },
        ];
        await this.documentModel.insertMany(seedDocs);
        console.log('🌱 Successfully seeded initial Documents and Legal templates database collection.');
      } else {
        console.log('⚠️ No users found in database to assign seed Documents to. Seeding skipped.');
      }
    }
  }

  async create(
    createDto: CreateDocumentDto,
    userId?: string,
  ): Promise<DocumentClassDocument> {
    const docData: any = {
      ...createDto,
    };

    if (userId) {
      docData.createdBy = userId;
    }

    const newDoc = new this.documentModel(docData);
    const saved = await newDoc.save();

    await this.activitiesService.log(
      `Uploaded document: "${saved.title}" [Type: ${saved.type}] under folder "${saved.folder || 'Root'}"`,
      ActivityType.DOCUMENT,
      userId,
    );

    return saved.populate(['assignee', 'createdBy']);
  }

  async findAll(
    query: QueryDocumentDto,
  ): Promise<{ documents: DocumentClassDocument[]; total: number }> {
    const { type, search, folder, branch, assignee, page = 1, limit = 10, sortBy = 'Create Date', orderBy = 'Desc' } = query;
    const filter: any = {};

    if (type) {
      filter.type = type;
    }

    if (folder) {
      filter.folder = folder;
    }

    if (branch) {
      filter.branch = branch;
    }

    if (assignee) {
      filter.assignee = assignee;
    }

    if (search) {
      filter.$or = [
        { title: new RegExp(search, 'i') },
        { description: new RegExp(search, 'i') },
        { folder: new RegExp(search, 'i') },
        { branch: new RegExp(search, 'i') },
      ];
    }

    const total = await this.documentModel.countDocuments(filter).exec();

    // Map sort dropdown option to mongoose field path
    const dir: 1 | -1 = orderBy === 'Asc' ? 1 : -1;
    const sortFieldMap: Record<string, string> = {
      'Create Date': 'createdAt',
      Title: 'title',
      'Updated Date': 'updatedAt',
    };
    const sortField = sortFieldMap[sortBy] || 'createdAt';
    const sortObj = { [sortField]: dir };

    let queryChain = this.documentModel.find(filter).sort(sortObj);

    if (limit > 0 && limit < 99999) {
      queryChain = queryChain.skip((page - 1) * limit).limit(limit);
    }

    const documents = await queryChain.populate(['assignee', 'createdBy']).exec();

    return { documents, total };
  }

  async findOne(id: string): Promise<DocumentClassDocument> {
    const doc = await this.documentModel
      .findById(id)
      .populate(['assignee', 'createdBy'])
      .exec();

    if (!doc) {
      throw new NotFoundException(`Document with ID "${id}" not found`);
    }

    return doc;
  }

  async update(
    id: string,
    updateDto: UpdateDocumentDto,
    userId?: string,
  ): Promise<DocumentClassDocument> {
    const updated = await this.documentModel
      .findByIdAndUpdate(id, updateDto, { new: true })
      .populate(['assignee', 'createdBy'])
      .exec();

    if (!updated) {
      throw new NotFoundException(`Document with ID "${id}" not found`);
    }

    await this.activitiesService.log(
      `Modified details for document: "${updated.title}"`,
      ActivityType.DOCUMENT,
      userId,
    );

    return updated;
  }

  async remove(id: string, userId?: string): Promise<void> {
    const doc = await this.documentModel.findById(id).exec();
    if (!doc) {
      throw new NotFoundException(`Document with ID "${id}" not found`);
    }

    await this.documentModel.findByIdAndDelete(id).exec();

    await this.activitiesService.log(
      `Deleted document: "${doc.title}"`,
      ActivityType.DOCUMENT,
      userId,
    );
  }
}
