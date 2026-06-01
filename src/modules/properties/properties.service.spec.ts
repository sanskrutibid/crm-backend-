import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { PropertiesService } from './properties.service';
import { Property, PropertyStatus } from './schemas/property.schema';
import { ActivitiesService } from '../activities/activities.service';
import { ActivityType } from '../activities/schemas/activity.schema';

describe('PropertiesService', () => {
  let service: PropertiesService;
  let mockPropertyModel: any;
  let mockActivitiesService: any;

  const mockPropertyDoc = (dto: any) => ({
    ...dto,
    _id: '60d5ed7ab394142e88a38c29',
    save: jest.fn().mockResolvedValue({
      _id: '60d5ed7ab394142e88a38c29',
      ...dto,
      name: dto.name || 'Unnamed Property',
      populate: jest.fn().mockResolvedValue({
        _id: '60d5ed7ab394142e88a38c29',
        ...dto,
        name: dto.name || 'Unnamed Property',
      }),
    }),
  });

  beforeEach(async () => {
    mockPropertyModel = jest
      .fn()
      .mockImplementation((dto) => mockPropertyDoc(dto));
    mockPropertyModel.countDocuments = jest.fn().mockReturnValue({
      exec: jest.fn().mockResolvedValue(10),
    });
    mockPropertyModel.find = jest.fn().mockReturnValue({
      sort: jest.fn().mockReturnValue({
        skip: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            populate: jest.fn().mockReturnValue({
              exec: jest.fn().mockResolvedValue([]),
            }),
          }),
        }),
      }),
    });
    mockPropertyModel.findById = jest.fn().mockReturnValue({
      populate: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      }),
    });
    mockPropertyModel.findByIdAndUpdate = jest.fn().mockReturnValue({
      populate: jest.fn().mockReturnValue({
        exec: jest
          .fn()
          .mockImplementation((id, update) => mockPropertyDoc(update)),
      }),
    });

    mockActivitiesService = {
      log: jest.fn().mockResolvedValue(null),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PropertiesService,
        {
          provide: getModelToken(Property.name),
          useValue: mockPropertyModel,
        },
        {
          provide: ActivitiesService,
          useValue: mockActivitiesService,
        },
      ],
    }).compile();

    service = module.get<PropertiesService>(PropertiesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should map legacy required fields from wizard fields during creation', async () => {
      const wizardDto = {
        projectDeveloperName: 'Carter Luxury Tower',
        address: 'Bandra West, Carter Road',
        propertyType: 'Penthouse',
        expectedPrice: 45000000, // 4.5 Cr
        priceMode: 'Lumpsum',
        area: 2500,
      };

      await service.create(wizardDto);

      // Verify that instantiation of propertyModel was called with legacy fields auto-populated
      expect(mockPropertyModel).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Carter Luxury Tower',
          location: 'Bandra West, Carter Road',
          type: 'Penthouse',
          price: '₹4.50 Cr (Lumpsum)',
          sqft: 2500,
          builder: 'Carter Luxury Tower',
          projectDeveloperName: 'Carter Luxury Tower',
          address: 'Bandra West, Carter Road',
          propertyType: 'Penthouse',
          expectedPrice: 45000000,
          priceMode: 'Lumpsum',
          area: 2500,
        }),
      );

      // Verify that activity logs were created
      expect(mockActivitiesService.log).toHaveBeenCalledWith(
        expect.stringContaining('Added a new property listing'),
        ActivityType.PROPERTY,
      );
    });

    it('should associate createdBy and assignedTo when requestUserId is provided during creation', async () => {
      const wizardDto = {
        projectDeveloperName: 'Carter Luxury Tower',
      };

      await service.create(wizardDto, 'mock-user-id');

      expect(mockPropertyModel).toHaveBeenCalledWith(
        expect.objectContaining({
          createdBy: 'mock-user-id',
          assignedTo: 'mock-user-id',
        }),
      );
    });

    it('should maintain backward compatibility when legacy required fields are explicitly provided', async () => {
      const legacyDto = {
        name: 'Direct Legacy Name',
        location: 'Legacy Location',
        type: 'Legacy Type',
        price: '₹1.50 Cr',
        sqft: 1200,
        builder: 'Legacy Builder',
      };

      await service.create(legacyDto);

      expect(mockPropertyModel).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Direct Legacy Name',
          location: 'Legacy Location',
          type: 'Legacy Type',
          price: '₹1.50 Cr',
          sqft: 1200,
          builder: 'Legacy Builder',
        }),
      );
    });
  });

  describe('getMyProperties', () => {
    it('should restrict properties to the logged-in user via $or filter and support custom sorting', async () => {
      const query = {
        sortBy: 'Requested Date',
        orderBy: 'Asc' as const,
      };

      await service.getMyProperties(query, 'mock-user-id');

      expect(mockPropertyModel.find).toHaveBeenCalledWith(
        expect.objectContaining({
          $or: [
            { createdBy: 'mock-user-id' },
            { assignedTo: 'mock-user-id' },
            { assignee: 'mock-user-id' },
          ],
        }),
      );

      // Verify that the query chain sorts by Requested Date (requestDate) in Ascending order (1)
      expect(mockPropertyModel.find().sort).toHaveBeenCalledWith({
        requestDate: 1,
      });
    });
  });

  describe('getAvailableProperties', () => {
    it('should restrict properties to Available status only and support custom sorting', async () => {
      const query = {
        sortBy: 'Price',
        orderBy: 'Desc' as const,
      };

      await service.getAvailableProperties(query);

      expect(mockPropertyModel.find).toHaveBeenCalledWith(
        expect.objectContaining({
          status: PropertyStatus.AVAILABLE,
        }),
      );

      // Verify that the query chain sorts by Price (expectedPrice) in Descending order (-1)
      expect(mockPropertyModel.find().sort).toHaveBeenCalledWith({
        expectedPrice: -1,
      });
    });
  });

  describe('update', () => {
    it('should dynamically update legacy price when expectedPrice is changed', async () => {
      const updateDto = {
        expectedPrice: 38000000, // 3.8 Cr
        priceMode: 'Negotiable',
      };

      mockPropertyModel.findByIdAndUpdate = jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue({
            name: 'Existing Project',
          }),
        }),
      });

      await service.update('mock-id', updateDto);

      expect(mockPropertyModel.findByIdAndUpdate).toHaveBeenCalledWith(
        'mock-id',
        expect.objectContaining({
          expectedPrice: 38000000,
          priceMode: 'Negotiable',
          price: '₹3.80 Cr (Negotiable)',
        }),
        expect.any(Object),
      );
    });
  });
});
