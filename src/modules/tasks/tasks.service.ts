import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Task, TaskDocument, TaskStatus } from './schemas/task.schema';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { QueryTaskDto } from './dto/query-task.dto';
import { User, UserDocument } from '../users/schemas/user.schema';
import { ActivitiesService } from '../activities/activities.service';
import { ActivityType } from '../activities/schemas/activity.schema';

@Injectable()
export class TasksService implements OnModuleInit {
  constructor(
    @InjectModel(Task.name) private readonly taskModel: Model<TaskDocument>,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    private readonly activitiesService: ActivitiesService,
  ) {}

  /**
   * Automatically seed initial follow-up tasks if the database collection is empty,
   * assigning them to the first available user in the system.
   */
  async onModuleInit() {
    const taskCount = await this.taskModel.countDocuments().exec();
    if (taskCount === 0) {
      const defaultUser = await this.userModel.findOne().exec();
      if (defaultUser) {
        const initialTasks: Partial<Task>[] = [
          {
            task: 'Schedule site escort visit for Vikram Singh',
            description: 'Provide row villa structural updates',
            scheduledDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            scheduleTime: '3:30pm',
            branch: 'Mumbai Bandra',
            status: TaskStatus.OPEN,
            assignedTo: defaultUser._id as any,
          },
          {
            task: 'Share booking forms & quotation draft',
            description: 'Quotation details and payment link',
            scheduledDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            scheduleTime: '11:00am',
            branch: 'Noida Hub',
            status: TaskStatus.CLOSED,
            assignedTo: defaultUser._id as any,
          },
          {
            task: 'Follow-up call on token advance payment',
            description: 'Confirm token advance with bank finance team',
            scheduledDate: new Date().toISOString().split('T')[0],
            scheduleTime: '5:45pm',
            branch: 'Whitefield Bangalore',
            status: TaskStatus.OPEN,
            assignedTo: defaultUser._id as any,
          },
          {
            task: 'Collect structural updates details from site manager',
            description: 'Regular construction check log',
            scheduledDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            scheduleTime: '10:00am',
            branch: 'Pune Solitaire',
            status: TaskStatus.OPEN,
            assignedTo: defaultUser._id as any,
          },
        ];
        await this.taskModel.insertMany(initialTasks);
        console.log('🌱 Successfully seeded initial Task directory database collection.');
      } else {
        console.log('⚠️ No users found in database to assign seed Tasks to. Seeding skipped.');
      }
    }
  }

  async create(createTaskDto: CreateTaskDto, defaultUserId: string): Promise<TaskDocument> {
    const assignedTo = createTaskDto.assignedTo || defaultUserId;
    const newTask = new this.taskModel({
      ...createTaskDto,
      assignedTo,
    });
    const savedTask = await newTask.save();

    // Log task addition
    await this.activitiesService.log(
      `Added task: "${savedTask.task}"`,
      ActivityType.TASK,
      defaultUserId,
    );

    return savedTask.populate('assignedTo');
  }

  async findAll(query: QueryTaskDto): Promise<{ tasks: TaskDocument[]; total: number }> {
    const { status, search, assignedTo, sortBy = 'createdAt', sortOrder = 'desc', updatedSince, page = 1, limit = 10 } = query;
    const filter: any = {};

    if (status) {
      filter.status = status;
    }

    if (assignedTo) {
      filter.assignedTo = assignedTo;
    }

    if (search) {
      filter.$or = [
        { task: new RegExp(search, 'i') },
        { description: new RegExp(search, 'i') },
        { branch: new RegExp(search, 'i') },
      ];
    }

    // Sync Filter: Retrieve task records modified after this timestamp
    if (updatedSince) {
      filter.updatedAt = { $gte: new Date(updatedSince) };
    }

    // Dynamic sorting with typecast bypass for Mongoose interface compatibility
    const sortField = sortBy || 'createdAt';
    const sortDirection = sortOrder === 'asc' ? 1 : -1;
    const sortOption: any = { [sortField]: sortDirection };

    const total = await this.taskModel.countDocuments(filter).exec();
    
    // Pagination bypass logic: If limit is >= 99999, return all matching records at once
    const queryChain = this.taskModel.find(filter).populate('assignedTo').sort(sortOption);

    if (limit > 0 && limit < 99999) {
      queryChain.skip((page - 1) * limit).limit(limit);
    }

    const tasks = await queryChain.exec();
    return { tasks, total };
  }

  async findOne(id: string): Promise<TaskDocument> {
    const task = await this.taskModel.findById(id).populate('assignedTo').exec();
    if (!task) {
      throw new NotFoundException(`Task item with ID "${id}" not found`);
    }
    return task;
  }

  async update(id: string, updateTaskDto: UpdateTaskDto): Promise<TaskDocument> {
    const originalTask = await this.taskModel.findById(id).exec();
    if (!originalTask) {
      throw new NotFoundException(`Task item with ID "${id}" not found`);
    }

    const updatedTask = await this.taskModel
      .findByIdAndUpdate(id, updateTaskDto, { new: true })
      .populate('assignedTo')
      .exec();

    if (!updatedTask) {
      throw new NotFoundException(`Task item with ID "${id}" not found`);
    }

    // Log completion state change or standard update
    if (updateTaskDto.status && originalTask.status !== updateTaskDto.status) {
      await this.activitiesService.log(
        `Updated status of follow-up "${updatedTask.task}" to "${updatedTask.status}"`,
        ActivityType.TASK,
      );
    } else {
      await this.activitiesService.log(
        `Modified task details: "${updatedTask.task}"`,
        ActivityType.TASK,
      );
    }

    return updatedTask;
  }

  async remove(id: string): Promise<void> {
    const task = await this.taskModel.findById(id).exec();
    if (!task) {
      throw new NotFoundException(`Task item with ID "${id}" not found`);
    }

    await this.taskModel.findByIdAndDelete(id).exec();

    // Log task deletion
    await this.activitiesService.log(
      `Deleted task: "${task.task}"`,
      ActivityType.TASK,
    );
  }
}
