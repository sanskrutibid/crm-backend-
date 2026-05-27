import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Property, PropertyDocument, PropertyStatus } from './schemas/property.schema';
import { CreatePropertyDto } from './dto/create-property.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';
import { QueryPropertyDto } from './dto/query-property.dto';
import { ActivitiesService } from '../activities/activities.service';
import { ActivityType } from '../activities/schemas/activity.schema';

@Injectable()
export class PropertiesService implements OnModuleInit {
  constructor(
    @InjectModel(Property.name) private readonly propertyModel: Model<PropertyDocument>,
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
      console.log('🌱 Successfully seeded initial Properties directory database collection.');
    }
  }

  async create(createPropertyDto: CreatePropertyDto): Promise<PropertyDocument> {
    const newProperty = new this.propertyModel(createPropertyDto);
    const savedProperty = await newProperty.save();

    // Log the addition in activity stream
    await this.activitiesService.log(
      `Added a new property listing "${savedProperty.name}"`,
      ActivityType.PROPERTY,
    );

    return savedProperty;
  }

  async findAll(query: QueryPropertyDto): Promise<{ properties: PropertyDocument[]; total: number }> {
    const { status, search, updatedSince, page = 1, limit = 10 } = query;
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
    const queryChain = this.propertyModel.find(filter).sort({ createdAt: -1 });

    if (limit > 0 && limit < 99999) {
      queryChain.skip((page - 1) * limit).limit(limit);
    }

    const properties = await queryChain.exec();
    return { properties, total };
  }

  async findOne(id: string): Promise<PropertyDocument> {
    const property = await this.propertyModel.findById(id).exec();
    if (!property) {
      throw new NotFoundException(`Property listing with ID "${id}" not found`);
    }
    return property;
  }

  async update(id: string, updatePropertyDto: UpdatePropertyDto): Promise<PropertyDocument> {
    const updatedProperty = await this.propertyModel
      .findByIdAndUpdate(id, updatePropertyDto, { new: true })
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
