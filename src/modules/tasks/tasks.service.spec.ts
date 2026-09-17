import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { TasksService } from './tasks.service';
import { Task } from './schemas/task.schema';
import { ActivitiesService } from '../activities/activities.service';
import { BadRequestException } from '@nestjs/common';

describe('TasksService', () => {
  let service: TasksService;
  let mockTaskModel: any;
  let mockActivitiesService: any;

  const mockTaskDoc = (dto: any) => ({
    ...dto,
    _id: 'mock-task-id',
    save: jest.fn().mockResolvedValue({
      _id: 'mock-task-id',
      ...dto,
      populate: jest.fn().mockResolvedValue({
        _id: 'mock-task-id',
        ...dto,
      }),
    }),
  });

  beforeEach(async () => {
    mockTaskModel = jest.fn().mockImplementation((dto) => mockTaskDoc(dto));
    mockTaskModel.countDocuments = jest.fn().mockReturnValue({
      exec: jest.fn().mockResolvedValue(0),
    });
    mockTaskModel.findById = jest.fn().mockReturnValue({
      exec: jest.fn().mockResolvedValue({
        _id: 'mock-task-id',
        task: 'Original Task',
        status: 'Open',
      }),
    });
    mockTaskModel.findByIdAndUpdate = jest.fn().mockReturnValue({
      populate: jest.fn().mockReturnValue({
        exec: jest.fn().mockImplementation((id, update) => ({
          _id: 'mock-task-id',
          task: 'Updated Task',
          status: 'Open',
          ...update,
        })),
      }),
    });

    mockActivitiesService = {
      log: jest.fn().mockResolvedValue(null),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TasksService,
        {
          provide: getModelToken(Task.name),
          useValue: mockTaskModel,
        },
        {
          provide: ActivitiesService,
          useValue: mockActivitiesService,
        },
      ],
    }).compile();

    service = module.get<TasksService>(TasksService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should successfully create a task when scheduledDate is provided', async () => {
      const dto = {
        task: 'Test Task',
        scheduledDate: '2026-06-04',
        scheduleTime: '3:00pm',
      };

      await service.create(dto);

      expect(mockTaskModel).toHaveBeenCalledWith(
        expect.objectContaining({
          task: 'Test Task',
          scheduledDate: '2026-06-04',
          scheduleTime: '3:00pm',
        }),
      );
    });

    it('should successfully create a task and normalize scheduleDate to scheduledDate', async () => {
      const dto = {
        task: 'Test Task',
        scheduleDate: '2026-06-04',
        scheduleTime: '3:00pm',
      };

      await service.create(dto);

      expect(mockTaskModel).toHaveBeenCalledWith(
        expect.objectContaining({
          task: 'Test Task',
          scheduledDate: '2026-06-04',
          scheduleTime: '3:00pm',
        }),
      );

      // Verify scheduleDate was not directly passed to the model
      const callArg = mockTaskModel.mock.calls[0][0];
      expect(callArg.scheduleDate).toBeUndefined();
    });

    it('should throw BadRequestException if neither scheduledDate nor scheduleDate is provided', async () => {
      const dto = {
        task: 'Test Task',
        scheduleTime: '3:00pm',
      };

      await expect(service.create(dto as any)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('update', () => {
    it('should normalize scheduleDate to scheduledDate on update', async () => {
      const dto = {
        scheduleDate: '2026-06-05',
      };

      await service.update('mock-task-id', dto);

      expect(mockTaskModel.findByIdAndUpdate).toHaveBeenCalledWith(
        'mock-task-id',
        expect.objectContaining({
          scheduledDate: '2026-06-05',
        }),
        expect.any(Object),
      );

      // Verify scheduleDate was not directly passed in update
      const updateArg = mockTaskModel.findByIdAndUpdate.mock.calls[0][1];
      expect(updateArg.scheduleDate).toBeUndefined();
    });

    it('should use scheduledDate if both scheduleDate and scheduledDate are provided on update', async () => {
      const dto = {
        scheduledDate: '2026-06-06',
        scheduleDate: '2026-06-05',
      };

      await service.update('mock-task-id', dto);

      expect(mockTaskModel.findByIdAndUpdate).toHaveBeenCalledWith(
        'mock-task-id',
        expect.objectContaining({
          scheduledDate: '2026-06-06',
        }),
        expect.any(Object),
      );
    });
  });
});
