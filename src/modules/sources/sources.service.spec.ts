import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { SourcesService } from './sources.service';
import { Source } from './schemas/source.schema';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';

describe('SourcesService', () => {
  let service: SourcesService;
  let mockSourceModel: any;

  const mockSource = {
    _id: '65a000000000000000000001',
    sourceId: 1,
    name: 'Google Ads',
    save: jest.fn().mockImplementation(function () {
      return Promise.resolve(this);
    }),
  };

  beforeEach(async () => {
    mockSourceModel = jest.fn().mockImplementation((dto) => ({
      ...dto,
      _id: '65a000000000000000000002',
      save: jest.fn().mockResolvedValue({
        _id: '65a000000000000000000002',
        ...dto,
      }),
    }));

    mockSourceModel.findOne = jest.fn();
    mockSourceModel.find = jest.fn();
    mockSourceModel.findById = jest.fn();
    mockSourceModel.findByIdAndUpdate = jest.fn();
    mockSourceModel.findByIdAndDelete = jest.fn();
    mockSourceModel.countDocuments = jest.fn();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SourcesService,
        {
          provide: getModelToken(Source.name),
          useValue: mockSourceModel,
        },
      ],
    }).compile();

    service = module.get<SourcesService>(SourcesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a source with autoincremented sourceId 1 when no sources exist', async () => {
      mockSourceModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
        sort: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockReturnThis(),
      });
      mockSourceModel.countDocuments.mockReturnValue({
        exec: jest.fn().mockResolvedValue(0),
      });

      const result = await service.create({ name: 'Google Ads' });
      expect(result).toBeDefined();
      expect(result.sourceId).toBe(1);
      expect(result.name).toBe('Google Ads');
    });

    it('should calculate next sourceId (e.g. 5 + 1 = 6)', async () => {
      // For duplicate check
      mockSourceModel.findOne.mockReturnValueOnce({
        exec: jest.fn().mockResolvedValue(null),
      });
      // For max sourceId
      mockSourceModel.findOne.mockReturnValueOnce({
        sort: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            lean: jest.fn().mockReturnValue({
              exec: jest.fn().mockResolvedValue({ sourceId: 5 }),
            }),
          }),
        }),
      });

      const result = await service.create({ sourceName: 'Facebook Ads' });
      expect(result.sourceId).toBe(6);
      expect(result.name).toBe('Facebook Ads');
    });

    it('should throw BadRequestException if source name is missing/empty', async () => {
      await expect(service.create({ name: '   ' })).rejects.toThrow(BadRequestException);
    });

    it('should throw ConflictException if source name already exists', async () => {
      mockSourceModel.findOne.mockReturnValueOnce({
        exec: jest.fn().mockResolvedValue({ _id: '123', name: 'Google Ads' }),
      });

      await expect(service.create({ name: 'Google Ads' })).rejects.toThrow(ConflictException);
    });
  });

  describe('findAll', () => {
    it('should return all sources sorted by sourceId', async () => {
      const sources = [
        { sourceId: 1, name: 'Facebook' },
        { sourceId: 2, name: 'Google' },
      ];
      mockSourceModel.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(sources),
        }),
      });

      const result = await service.findAll();
      expect(result).toEqual(sources);
    });
  });

  describe('findOne', () => {
    it('should find by numeric sourceId', async () => {
      mockSourceModel.findOne.mockReturnValueOnce({
        exec: jest.fn().mockResolvedValue(mockSource),
      });

      const result = await service.findOne('1');
      expect(result).toEqual(mockSource);
      expect(mockSourceModel.findOne).toHaveBeenCalledWith({ sourceId: 1 });
    });

    it('should find by MongoDB ObjectId', async () => {
      mockSourceModel.findById.mockReturnValueOnce({
        exec: jest.fn().mockResolvedValue(mockSource),
      });

      const result = await service.findOne('65a000000000000000000001');
      expect(result).toEqual(mockSource);
    });

    it('should throw NotFoundException when source not found', async () => {
      mockSourceModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(service.findOne('999')).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should remove source by sourceId or ObjectId', async () => {
      mockSourceModel.findOne.mockReturnValueOnce({
        exec: jest.fn().mockResolvedValue(mockSource),
      });
      mockSourceModel.findByIdAndDelete.mockReturnValueOnce({
        exec: jest.fn().mockResolvedValue(mockSource),
      });

      await service.remove('1');
      expect(mockSourceModel.findByIdAndDelete).toHaveBeenCalledWith(mockSource._id);
    });
  });
});
