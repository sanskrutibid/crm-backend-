import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { History, HistoryDocument, HistoryPriority } from './schemas/history.schema';
import { Contact, ContactDocument } from '../contacts/schemas/contact.schema';
import { Project, ProjectDocument } from '../projects/schemas/project.schema';
import { CreateHistoryDto } from './dto/create-history.dto';
import { UpdateHistoryDto } from './dto/update-history.dto';
import { QueryHistoryDto } from './dto/query-history.dto';

@Injectable()
export class HistoriesService {
  constructor(
    @InjectModel(History.name) private readonly historyModel: Model<HistoryDocument>,
    @InjectModel(Contact.name) private readonly contactModel: Model<ContactDocument>,
    @InjectModel(Project.name) private readonly projectModel: Model<ProjectDocument>,
  ) {}

  async create(createHistoryDto: CreateHistoryDto): Promise<HistoryDocument> {
    const contact = await this.contactModel.findById(createHistoryDto.contactId).exec();
    if (!contact) {
      throw new NotFoundException(`Contact with ID "${createHistoryDto.contactId}" not found`);
    }

    if (createHistoryDto.projectId) {
      const project = await this.projectModel.findById(createHistoryDto.projectId).exec();
      if (!project) {
        throw new NotFoundException(`Project with ID "${createHistoryDto.projectId}" not found`);
      }
    }

    const newHistory = new this.historyModel(createHistoryDto);
    const saved = await newHistory.save();
    return saved.populate(['contactId', 'projectId']);
  }

  async findAll(query: QueryHistoryDto): Promise<{ histories: HistoryDocument[]; total: number }> {
    const {
      contactId,
      priority,
      projectId,
      projectName,
      location,
      clientLocation,
      search,
      sortBy = 'date',
      sortOrder = 'desc',
      page = 1,
      limit = 10,
    } = query;

    const filter: any = {};

    if (contactId) {
      filter.contactId = contactId;
    }

    if (priority) {
      filter.priority = priority;
    }

    if (projectId) {
      filter.projectId = projectId;
    }

    // Advanced Filter: Filter by Project Name
    if (projectName) {
      const matchedProjects = await this.projectModel
        .find({ projectName: new RegExp(projectName, 'i') })
        .select('_id')
        .exec();
      const projectIds = matchedProjects.map((p) => p._id);
      filter.projectId = { $in: projectIds };
    }

    // Advanced Filter: Filter by history location
    if (location) {
      filter.location = new RegExp(location, 'i');
    }

    // Advanced Filter: Filter by client's location (city or locality)
    if (clientLocation) {
      const matchedContacts = await this.contactModel
        .find({
          $or: [
            { city: new RegExp(clientLocation, 'i') },
            { locality: new RegExp(clientLocation, 'i') },
            { address: new RegExp(clientLocation, 'i') },
          ],
        })
        .select('_id')
        .exec();
      const contactIds = matchedContacts.map((c) => c._id);
      filter.contactId = { $in: contactIds };
    }

    if (search) {
      filter.conversation = new RegExp(search, 'i');
    }

    const total = await this.historyModel.countDocuments(filter).exec();

    // Determine sort structure
    let queryChain;
    if (sortBy === 'priority') {
      const sortDirection = sortOrder === 'asc' ? 1 : -1;
      const pipeline: any[] = [
        { $match: filter },
        {
          $addFields: {
            priorityWeight: {
              $switch: {
                branches: [
                  { case: { $eq: ['$priority', HistoryPriority.LOW] }, then: 1 },
                  { case: { $eq: ['$priority', HistoryPriority.MEDIUM] }, then: 2 },
                  { case: { $eq: ['$priority', HistoryPriority.HIGH] }, then: 3 },
                ],
                default: 0,
              },
            },
          },
        },
        { $sort: { priorityWeight: sortDirection, date: -1 } },
      ];

      // Pagination
      if (limit > 0 && limit < 99999) {
        pipeline.push({ $skip: (page - 1) * limit });
        pipeline.push({ $limit: limit });
      }

      const rawHistories = await this.historyModel.aggregate(pipeline).exec();
      const populated = await this.historyModel.populate(rawHistories, [
        { path: 'contactId' },
        { path: 'projectId' },
      ]);
      return { histories: populated as any, total };
    } else {
      const sortDirection = sortOrder === 'asc' ? 1 : -1;
      const sortField = sortBy || 'date';
      queryChain = this.historyModel
        .find(filter)
        .populate(['contactId', 'projectId'])
        .sort({ [sortField]: sortDirection });

      if (limit > 0 && limit < 99999) {
        queryChain.skip((page - 1) * limit).limit(limit);
      }

      const histories = await queryChain.exec();
      return { histories, total };
    }
  }

  async findOne(id: string): Promise<HistoryDocument> {
    const history = await this.historyModel
      .findById(id)
      .populate(['contactId', 'projectId'])
      .exec();
    if (!history) {
      throw new NotFoundException(`History log with ID "${id}" not found`);
    }
    return history;
  }

  async update(id: string, updateHistoryDto: UpdateHistoryDto): Promise<HistoryDocument> {
    const history = await this.historyModel.findById(id).exec();
    if (!history) {
      throw new NotFoundException(`History log with ID "${id}" not found`);
    }

    if (updateHistoryDto.contactId) {
      const contact = await this.contactModel.findById(updateHistoryDto.contactId).exec();
      if (!contact) {
        throw new NotFoundException(`Contact with ID "${updateHistoryDto.contactId}" not found`);
      }
    }

    if (updateHistoryDto.projectId) {
      const project = await this.projectModel.findById(updateHistoryDto.projectId).exec();
      if (!project) {
        throw new NotFoundException(`Project with ID "${updateHistoryDto.projectId}" not found`);
      }
    }

    const updated = await this.historyModel
      .findByIdAndUpdate(id, updateHistoryDto, { new: true })
      .populate(['contactId', 'projectId'])
      .exec();

    if (!updated) {
      throw new NotFoundException(`History log with ID "${id}" not found`);
    }

    return updated;
  }

  async remove(id: string): Promise<void> {
    const result = await this.historyModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(`History log with ID "${id}" not found`);
    }
  }
}
