import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  Project,
  ProjectDocument,
  ProjectStatus,
  ProjectVisibility,
} from './schemas/project.schema';
import { Contact, ContactDocument } from '../contacts/schemas/contact.schema';
import { User, UserDocument } from '../users/schemas/user.schema';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { QueryProjectDto } from './dto/query-project.dto';
import { ActivitiesService } from '../activities/activities.service';
import { ActivityType } from '../activities/schemas/activity.schema';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectModel(Project.name)
    private readonly projectModel: Model<ProjectDocument>,
    @InjectModel(Contact.name)
    private readonly contactModel: Model<ContactDocument>,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    private readonly activitiesService: ActivitiesService,
  ) {}

  /**
   * Creates a new Project, supporting on-the-fly contact creation if requested.
   */
  async create(
    createProjectDto: CreateProjectDto,
    defaultUserId?: string,
  ): Promise<ProjectDocument> {
    const assignedTo = createProjectDto.assignedTo || defaultUserId;
    let targetContactId = createProjectDto.contactId;

    // 1. Handle on-the-fly Contact creation if requested
    if (createProjectDto.addNewContact) {
      if (!createProjectDto.name || !createProjectDto.mobile) {
        throw new BadRequestException(
          'Name and Mobile are required to create a new contact on-the-fly',
        );
      }

      // Parse salutation, firstName, lastName from name string
      let salutation: string | undefined = undefined;
      let firstName = 'Unknown';
      let lastName: string | undefined = undefined;

      const nameParts = (createProjectDto.name || '').trim().split(/\s+/);
      if (nameParts.length > 0) {
        const firstPart = nameParts[0].replace(/\./g, '');
        const salutations = ['mr', 'mrs', 'ms', 'dr', 'prof', 'sir'];
        if (salutations.includes(firstPart.toLowerCase())) {
          salutation = nameParts[0];
          nameParts.shift();
        }
      }
      if (nameParts.length > 0) {
        firstName = nameParts[0];
        nameParts.shift();
      }
      if (nameParts.length > 0) {
        lastName = nameParts.join(' ');
      }

      const newContact = new this.contactModel({
        salutation,
        firstName,
        lastName,
        customerType: 'Customer',
        contactType: 'Employee',
        mobile: createProjectDto.mobile,
        email: createProjectDto.email
          ? createProjectDto.email.toLowerCase().trim()
          : undefined,
        companyName: createProjectDto.company,
        source: 'Project',
        branch: createProjectDto.branch || 'Global Team',
        assignedTo: assignedTo,
      });

      const savedContact = await newContact.save();
      targetContactId = savedContact._id.toString();

      await this.activitiesService.log(
        `Created new contact "${createProjectDto.name}" on-the-fly during project creation`,
        ActivityType.OPPORTUNITY, // General log category
        defaultUserId,
      );
    } else {
      if (!targetContactId) {
        throw new BadRequestException(
          'Either contactId must be provided or addNewContact must be set to true',
        );
      }

      // Verify the contact exists
      const contactExists = await this.contactModel
        .findById(targetContactId)
        .exec();
      if (!contactExists) {
        throw new NotFoundException(
          `Contact with ID ${targetContactId} not found`,
        );
      }
    }

    // 2. Fetch target contact for descriptive activity log details
    const targetContact = await this.contactModel
      .findById(targetContactId)
      .exec();
    const contactDisplayName = targetContact
      ? `${targetContact.firstName} ${targetContact.lastName || ''}`.trim()
      : 'Unknown Owner';

    // 3. Create and Save the Project
    const newProject = new this.projectModel({
      ...createProjectDto,
      contactId: targetContactId,
      assignedTo: assignedTo,
      createdBy: defaultUserId,
      updatedBy: defaultUserId,
      status: createProjectDto.status || ProjectStatus.AVAILABLE,
    });

    const savedProject = await newProject.save();

    // 4. Log creation activity in general system logs
    await this.activitiesService.log(
      `Created new project "${createProjectDto.projectName}" (Owner: ${contactDisplayName}, Developer: ${createProjectDto.developerName || 'Unknown'}, City: ${createProjectDto.city})`,
      ActivityType.OPPORTUNITY,
      defaultUserId,
    );

    // 5. Populate and return complete object
    return savedProject.populate([
      'contactId',
      'assignedTo',
      'createdBy',
      'updatedBy',
    ]);
  }

  /**
   * Retrieves all project profiles based on advanced filters, search, and custom view types.
   */
  async findAll(
    query: QueryProjectDto,
    forceStatus?: ProjectStatus,
    forceReraOnly?: boolean,
  ): Promise<{ projects: ProjectDocument[]; total: number }> {
    const {
      viewType = 'all',
      search,
      projectName,
      reraNumber,
      type,
      totalRoom,
      priceFrom,
      priceTo,
      areaFrom,
      areaTo,
      areaUnit,
      city,
      locality,
      transaction,
      customer,
      submittedBy,
      branch,
      assignedTo,
      assignTo,
      dateFrom,
      dateTo,
      status,
      sortBy = 'Create Date',
      orderBy = 'Desc',
      page = 1,
      limit = 10,
    } = query;

    const filter: any = {};

    // 1. Unified Search mapping: Match against referenced contact, project fields
    if (search) {
      const matchedContacts = await this.contactModel
        .find({
          $or: [
            { firstName: new RegExp(search, 'i') },
            { lastName: new RegExp(search, 'i') },
            { mobile: new RegExp(search, 'i') },
            { email: new RegExp(search, 'i') },
          ],
        })
        .select('_id')
        .exec();

      const contactIds = matchedContacts.map((c) => c._id);

      filter.$or = [
        { contactId: { $in: contactIds } },
        { projectName: new RegExp(search, 'i') },
        { developerName: new RegExp(search, 'i') },
        { locality: new RegExp(search, 'i') },
        { city: new RegExp(search, 'i') },
        { keyword: new RegExp(search, 'i') },
        { description: new RegExp(search, 'i') },
        { websiteKeywords: new RegExp(search, 'i') },
        { reraNumber: new RegExp(search, 'i') },
      ];
    }

    // 2. Step 2 Advanced Filters (Screenshot 3 & 5)
    if (projectName) {
      filter.projectName = new RegExp(projectName, 'i');
    }

    if (reraNumber) {
      filter.reraNumber = new RegExp(reraNumber, 'i');
    }

    if (type) {
      filter.type = new RegExp(type, 'i');
    }

    if (totalRoom) {
      filter.totalRoom = new RegExp(totalRoom, 'i');
    }

    // Price range
    if (priceFrom !== undefined || priceTo !== undefined) {
      const priceRange: any = {};
      if (priceFrom !== undefined) priceRange.$gte = priceFrom;
      if (priceTo !== undefined) priceRange.$lte = priceTo;
      filter.price = priceRange;
    }

    // Area range
    if (areaFrom !== undefined || areaTo !== undefined) {
      const areaRange: any = {};
      if (areaFrom !== undefined) areaRange.$gte = areaFrom;
      if (areaTo !== undefined) areaRange.$lte = areaTo;
      filter.projectArea = areaRange;
    }

    if (areaUnit) {
      filter.areaUnit = areaUnit;
    }

    // Location & City
    if (city) {
      filter.city = new RegExp(city, 'i');
    }

    if (locality) {
      filter.locality = new RegExp(locality, 'i');
    }

    if (transaction) {
      filter.transactionType = new RegExp(transaction, 'i');
    }

    if (customer) {
      filter.contactId = customer;
    }

    if (submittedBy) {
      filter.createdBy = submittedBy;
    }

    if (branch) {
      filter.branch = new RegExp(branch, 'i');
    }

    const targetAssignee = assignedTo || assignTo;
    if (targetAssignee) {
      filter.assignedTo = targetAssignee;
    }

    // Creation date range
    if (dateFrom || dateTo) {
      const dateRange: any = {};
      if (dateFrom) dateRange.$gte = new Date(dateFrom);
      if (dateTo) dateRange.$lte = new Date(dateTo);
      filter.createdAt = dateRange;
    }

    // 3. Custom views / Forces
    if (forceStatus) {
      filter.status = forceStatus;
    } else if (status) {
      filter.status = status;
    } else if (viewType === 'available') {
      filter.status = ProjectStatus.AVAILABLE;
    }

    if (forceReraOnly || viewType === 'rera_hira') {
      filter.reraNumber = { $exists: true, $ne: '' };
    }

    // RERA Custom time-period sorting/filters (Last 7/30/90 days)
    if (sortBy === 'Last 7 days') {
      filter.createdAt = { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) };
    } else if (sortBy === 'Last 30 days') {
      filter.createdAt = { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) };
    } else if (sortBy === 'Last 90 days') {
      filter.createdAt = { $gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) };
    }

    const total = await this.projectModel.countDocuments(filter).exec();

    // Map sorting fields
    let sortField = 'createdAt';
    if (sortBy === 'Launch Date') {
      sortField = 'launchDate';
    } else if (sortBy === 'Create Date') {
      sortField = 'createdAt';
    } else if (sortBy === 'Updated Date') {
      sortField = 'updatedAt';
    } else if (sortBy === 'Project Name' || sortBy === 'Display Name') {
      sortField = 'projectName';
    } else if (sortBy === 'Location') {
      sortField = 'locality';
    }

    const sortOrder = orderBy === 'Asc' ? 1 : -1;
    const sortObj: any = {};
    if (sortBy === 'Customer Name') {
      sortObj['createdAt'] = -1; // Default fallback to sort by date before in-memory customer sort
    } else {
      sortObj[sortField] = sortOrder;
    }

    // Query execution
    const queryChain = this.projectModel
      .find(filter)
      .populate(['contactId', 'assignedTo', 'createdBy', 'updatedBy'])
      .sort(sortObj);

    if (limit > 0 && limit < 99999) {
      queryChain.skip((page - 1) * limit).limit(limit);
    }

    const projects = await queryChain.exec();

    // In-memory sorting for Customer Name (contact's firstName) or Display Name
    if (sortBy === 'Customer Name') {
      const dir = orderBy === 'Asc' ? 1 : -1;
      projects.sort((a, b) => {
        const nameA = (a.contactId as any)?.firstName || '';
        const nameB = (b.contactId as any)?.firstName || '';
        return nameA.localeCompare(nameB) * dir;
      });
    }

    return { projects, total };
  }

  /**
   * Retrieves single detailed Project record by ID.
   */
  async findOne(id: string): Promise<any> {
    const project = await this.projectModel
      .findById(id)
      .populate(['contactId', 'assignedTo', 'createdBy', 'updatedBy'])
      .exec();

    if (!project) {
      throw new NotFoundException(`Project with ID "${id}" not found`);
    }

    const projObj = project.toJSON();

    // Calculate days since launch date
    let daysSinceLaunch = 0;
    if (project.launchDate) {
      try {
        const launch = new Date(project.launchDate);
        if (!isNaN(launch.getTime())) {
          const diffTime = Math.abs(Date.now() - launch.getTime());
          daysSinceLaunch = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        }
      } catch (err) {
        // Safe fail
      }
    }
    projObj['daysSinceLaunch'] = daysSinceLaunch;

    return projObj;
  }

  /**
   * Modifies an existing project record profile.
   */
  async update(
    id: string,
    updateProjectDto: UpdateProjectDto,
  ): Promise<ProjectDocument> {
    const originalProject = await this.projectModel.findById(id).exec();
    if (!originalProject) {
      throw new NotFoundException(`Project with ID "${id}" not found`);
    }

    const updatedProject = await this.projectModel
      .findByIdAndUpdate(id, updateProjectDto, { new: true })
      .populate(['contactId', 'assignedTo', 'createdBy', 'updatedBy'])
      .exec();

    if (!updatedProject) {
      throw new NotFoundException(`Project with ID "${id}" not found`);
    }

    // Log update activity
    await this.activitiesService.log(
      `Modified project details for "${updatedProject.projectName}"`,
      ActivityType.OPPORTUNITY,
    );

    return updatedProject;
  }

  /**
   * Deletes a project record completely.
   */
  async remove(id: string): Promise<void> {
    const project = await this.projectModel.findById(id).exec();
    if (!project) {
      throw new NotFoundException(`Project with ID "${id}" not found`);
    }

    await this.projectModel.findByIdAndDelete(id).exec();

    await this.activitiesService.log(
      `Deleted project profile: "${project.projectName}"`,
      ActivityType.OPPORTUNITY,
    );
  }
}
