/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-argument */
import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  Property,
  PropertyDocument,
  PropertyStatus,
} from './schemas/property.schema';
import { CreatePropertyDto } from './dto/create-property.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';
import { QueryPropertyDto } from './dto/query-property.dto';
import { ActivitiesService } from '../activities/activities.service';
import { ActivityType } from '../activities/schemas/activity.schema';

@Injectable()
export class PropertiesService implements OnModuleInit {
  constructor(
    @InjectModel(Property.name)
    private readonly propertyModel: Model<PropertyDocument>,
    private readonly activitiesService: ActivitiesService,
  ) {}

  /**
   * Automatically seed initial premium real-estate properties if the database collection is empty.
   */
  async onModuleInit() {
    const count = await this.propertyModel.countDocuments().exec();
    if (count === 0) {
      const initialProperties: Partial<Property>[] = [
        {
          name: 'Greenwood Luxury Residency',
          location: 'Bandra West, Mumbai',
          type: '3 BHK Premium Apartment',
          price: '₹2.75 Cr',
          sqft: 1850,
          status: PropertyStatus.AVAILABLE,
          builder: 'Greenwood Infra Corp',
        },
        {
          name: 'Skyline Business Hub & Office Space',
          location: 'Sector 62, Noida',
          type: 'Commercial Showroom/Office',
          price: '₹1.20 Cr',
          sqft: 950,
          status: PropertyStatus.AVAILABLE,
          builder: 'Skyline Developers',
        },
        {
          name: 'Maple Wood Premium Row Villa',
          location: 'Whitefield, Bangalore',
          type: '4 BHK Luxury Row Villa',
          price: '₹3.90 Cr',
          sqft: 3200,
          status: PropertyStatus.UNDER_CONSTRUCTION,
          builder: 'Maple Wood Estates',
        },
        {
          name: 'Solitaire Penthouse & Sky Deck',
          location: 'Kalyani Nagar, Pune',
          type: '5 BHK Duplex Penthouse',
          price: '₹5.50 Cr',
          sqft: 4500,
          status: PropertyStatus.AVAILABLE,
          builder: 'Solitaire Landmarks',
        },
      ];
      await this.propertyModel.insertMany(initialProperties);
      console.log(
        '🌱 Successfully seeded initial Properties directory database collection.',
      );
    }
  }

  /**
   * Safe auto-mapping from new multi-step wizard fields to legacy base properties.
   * This maintains database integrity and ensures that widgets/cards relying on name, location,
   * type, price, sqft, or builder properties continue to display data correctly.
   */
  private mapLegacyFields(dto: any, isCreate = false): any {
    const mapped = { ...dto };

    if (isCreate) {
      if (!mapped.name) {
        mapped.name =
          mapped.projectDeveloperName ||
          mapped.buildingTowerProject ||
          'Unnamed Property';
      }
      if (!mapped.location) {
        mapped.location =
          mapped.address ||
          mapped.locality ||
          mapped.city ||
          'Unknown Location';
      }
      if (!mapped.type) {
        mapped.type = mapped.propertyType || 'Flat';
      }
      if (!mapped.price) {
        if (
          mapped.expectedPrice !== undefined &&
          mapped.expectedPrice !== null
        ) {
          const mode = mapped.priceMode ? ` (${mapped.priceMode})` : '';
          mapped.price = `₹${(mapped.expectedPrice / 10000000).toFixed(2)} Cr${mode}`;
        } else {
          mapped.price = '₹0';
        }
      }
      if (mapped.sqft === undefined || mapped.sqft === null) {
        mapped.sqft =
          mapped.area || mapped.builtUpArea || mapped.carpetArea || 0;
      }
      if (!mapped.builder) {
        mapped.builder = mapped.projectDeveloperName || 'Unknown Builder';
      }
    } else {
      // For updates, we dynamically compute base fields if the corresponding wizard field was modified
      if (mapped.projectDeveloperName || mapped.buildingTowerProject) {
        mapped.name =
          mapped.projectDeveloperName || mapped.buildingTowerProject;
      }
      if (mapped.address || mapped.locality || mapped.city) {
        mapped.location = mapped.address || mapped.locality || mapped.city;
      }
      if (mapped.propertyType) {
        mapped.type = mapped.propertyType;
      }
      if (mapped.expectedPrice !== undefined && mapped.expectedPrice !== null) {
        const mode = mapped.priceMode ? ` (${mapped.priceMode})` : '';
        mapped.price = `₹${(mapped.expectedPrice / 10000000).toFixed(2)} Cr${mode}`;
      }
      if (mapped.area !== undefined && mapped.area !== null) {
        mapped.sqft = mapped.area;
      } else if (
        mapped.builtUpArea !== undefined &&
        mapped.builtUpArea !== null
      ) {
        mapped.sqft = mapped.builtUpArea;
      } else if (
        mapped.carpetArea !== undefined &&
        mapped.carpetArea !== null
      ) {
        mapped.sqft = mapped.carpetArea;
      }
      if (mapped.projectDeveloperName) {
        mapped.builder = mapped.projectDeveloperName;
      }
    }

    return mapped;
  }

  async create(
    createPropertyDto: CreatePropertyDto,
    defaultUserId?: string,
  ): Promise<PropertyDocument> {
    const mappedDto = this.mapLegacyFields(createPropertyDto, true);

    // Populate createdBy and assignedTo if defaultUserId is available and they are not already set
    if (defaultUserId) {
      if (!mappedDto.createdBy) {
        mappedDto.createdBy = defaultUserId;
      }
      if (!mappedDto.assignedTo) {
        mappedDto.assignedTo = defaultUserId;
      }
    }

    const newProperty = new this.propertyModel(mappedDto);
    const savedProperty = await newProperty.save();

    // Log the addition in activity stream
    await this.activitiesService.log(
      `Added a new property listing "${savedProperty.name}"`,
      ActivityType.PROPERTY,
    );

    return savedProperty.populate(['createdBy', 'assignedTo']);
  }

  private buildSortObject(
    sortBy: string = 'Create Date',
    orderBy: 'Asc' | 'Desc' = 'Desc',
  ): Record<string, 1 | -1> {
    const dir: 1 | -1 = orderBy === 'Asc' ? 1 : -1;
    const fieldMap: Record<string, string> = {
      'Create Date': 'createdAt',
      'Requested Date': 'requestDate',
      'Customer Name': 'ownerLandlord',
      Building: 'buildingTowerProject',
      'Updated Date': 'updatedAt',
      Price: 'expectedPrice',
      Area: 'area',
      Location: 'address',
      'Property Type': 'propertyType',
    };
    const field = fieldMap[sortBy] ?? 'createdAt';
    return { [field]: dir };
  }

  async getMyProperties(
    query: QueryPropertyDto,
    userId?: string | null,
  ): Promise<{ properties: PropertyDocument[]; total: number }> {
    const {
      status,
      search,
      updatedSince,
      page = 1,
      limit = 10,
      sortBy = 'Create Date',
      orderBy = 'Desc',
    } = query;

    // Filter properties owned by or assigned to the logged-in user
    // Included legacy 'assignee' string match check for maximum resilience
    const filter: any = {
      $or: [
        { createdBy: userId },
        { assignedTo: userId },
        { assignee: userId },
      ],
    };

    if (status) {
      filter.status = status;
    }

    if (search) {
      filter.$and = filter.$and || [];
      filter.$and.push({
        $or: [
          { name: new RegExp(search, 'i') },
          { location: new RegExp(search, 'i') },
          { builder: new RegExp(search, 'i') },
          { type: new RegExp(search, 'i') },
        ],
      });
    }

    if (updatedSince) {
      filter.updatedAt = { $gte: new Date(updatedSince) };
    }

    const total = await this.propertyModel.countDocuments(filter).exec();
    const sortObj = this.buildSortObject(sortBy, orderBy);
    let queryChain = this.propertyModel.find(filter).sort(sortObj);

    if (limit > 0 && limit < 99999) {
      queryChain = queryChain.skip((page - 1) * limit).limit(limit);
    }

    const properties = await queryChain
      .populate(['createdBy', 'assignedTo'])
      .exec();
    return { properties, total };
  }

  async getAvailableProperties(
    query: QueryPropertyDto,
  ): Promise<{ properties: PropertyDocument[]; total: number }> {
    const {
      search,
      updatedSince,
      page = 1,
      limit = 10,
      sortBy = 'Create Date',
      orderBy = 'Desc',
    } = query;

    // Filter strictly for properties with status = 'Available'
    const filter: any = { status: PropertyStatus.AVAILABLE };

    if (search) {
      filter.$and = filter.$and || [];
      filter.$and.push({
        $or: [
          { name: new RegExp(search, 'i') },
          { location: new RegExp(search, 'i') },
          { builder: new RegExp(search, 'i') },
          { type: new RegExp(search, 'i') },
        ],
      });
    }

    if (updatedSince) {
      filter.updatedAt = { $gte: new Date(updatedSince) };
    }

    const total = await this.propertyModel.countDocuments(filter).exec();
    const sortObj = this.buildSortObject(sortBy, orderBy);
    let queryChain = this.propertyModel.find(filter).sort(sortObj);

    if (limit > 0 && limit < 99999) {
      queryChain = queryChain.skip((page - 1) * limit).limit(limit);
    }

    const properties = await queryChain
      .populate(['createdBy', 'assignedTo'])
      .exec();
    return { properties, total };
  }

  async findAll(
    query: QueryPropertyDto,
  ): Promise<{ properties: PropertyDocument[]; total: number }> {
    const {
      status,
      search,
      updatedSince,
      page = 1,
      limit = 10,
      sortBy = 'Create Date',
      orderBy = 'Desc',
    } = query;
    const filter: any = {};

    if (status) {
      filter.status = status;
    }

    if (search) {
      filter.$or = [
        { name: new RegExp(search, 'i') },
        { location: new RegExp(search, 'i') },
        { builder: new RegExp(search, 'i') },
        { type: new RegExp(search, 'i') },
      ];
    }

    // Sync Filter: Fetch records modified after this timestamp
    if (updatedSince) {
      filter.updatedAt = { $gte: new Date(updatedSince) };
    }

    const total = await this.propertyModel.countDocuments(filter).exec();

    // Pagination bypass logic: If limit is >= 99999, return all matching records at once
    const sortObj = this.buildSortObject(sortBy, orderBy);
    let queryChain = this.propertyModel.find(filter).sort(sortObj);

    if (limit > 0 && limit < 99999) {
      queryChain = queryChain.skip((page - 1) * limit).limit(limit);
    }

    const properties = await queryChain
      .populate(['createdBy', 'assignedTo'])
      .exec();
    return { properties, total };
  }

  async findOne(id: string): Promise<PropertyDocument> {
    const property = await this.propertyModel
      .findById(id)
      .populate(['createdBy', 'assignedTo'])
      .exec();
    if (!property) {
      throw new NotFoundException(`Property listing with ID "${id}" not found`);
    }
    return property;
  }

  async update(
    id: string,
    updatePropertyDto: UpdatePropertyDto,
  ): Promise<PropertyDocument> {
    const mappedDto = this.mapLegacyFields(updatePropertyDto, false);
    const updatedProperty = await this.propertyModel
      .findByIdAndUpdate(id, mappedDto, { new: true })
      .populate(['createdBy', 'assignedTo'])
      .exec();

    if (!updatedProperty) {
      throw new NotFoundException(`Property listing with ID "${id}" not found`);
    }

    // Log update operation
    await this.activitiesService.log(
      `Modified property listing details: "${updatedProperty.name}"`,
      ActivityType.PROPERTY,
    );

    return updatedProperty;
  }

  async remove(id: string): Promise<void> {
    const property = await this.propertyModel.findById(id).exec();
    if (!property) {
      throw new NotFoundException(`Property listing with ID "${id}" not found`);
    }

    await this.propertyModel.findByIdAndDelete(id).exec();

    // Log deletion operation
    await this.activitiesService.log(
      `Deleted property listing: "${property.name}"`,
      ActivityType.PROPERTY,
    );
  }
}
