import { Injectable, NotFoundException, OnModuleInit, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PropertyType, PropertyTypeDocument } from './schemas/property-type.schema';
import { CreatePropertyTypeDto } from './dto/create-property-type.dto';
import { UpdatePropertyTypeDto } from './dto/update-property-type.dto';

@Injectable()
export class PropertyTypesService {
  constructor(
    @InjectModel(PropertyType.name)
    private readonly propertyTypeModel: Model<PropertyTypeDocument>,
  ) { }

  // async onModuleInit() {
  //   const count = await this.propertyTypeModel.countDocuments().exec();
  //   if (count === 0) {
  //     const initialPropertyTypes: Partial<PropertyType>[] = [
  //       // Residential
  //       { category: 'Residential', subCategory: 'Flat / Apartment', isActive: true },
  //       { category: 'Residential', subCategory: 'House / Villa', isActive: true },
  //       { category: 'Residential', subCategory: 'Penthouse', isActive: true },
  //       { category: 'Residential', subCategory: 'Plot / Land', isActive: true },
  //       { category: 'Residential', subCategory: 'Builder Floor', isActive: true },
  //       { category: 'Residential', subCategory: 'Row House', isActive: true },
  //       // Commercial
  //       { category: 'Commercial', subCategory: 'Office Space', isActive: true },
  //       { category: 'Commercial', subCategory: 'Retail Shop', isActive: true },
  //       { category: 'Commercial', subCategory: 'Showroom', isActive: true },
  //       { category: 'Commercial', subCategory: 'Warehouse / Godown', isActive: true },
  //       { category: 'Commercial', subCategory: 'Industrial Shed', isActive: true },
  //       { category: 'Commercial', subCategory: 'Hotel / Guest House', isActive: true },
  //       // Industrial
  //       { category: 'Industrial', subCategory: 'Factory', isActive: true },
  //       { category: 'Industrial', subCategory: 'Manufacturing Unit', isActive: true },
  //       // Agricultural
  //       { category: 'Agricultural', subCategory: 'Farm Land', isActive: true },
  //     ];
  //     await this.propertyTypeModel.insertMany(initialPropertyTypes);
  //     console.log('🌱 Successfully seeded initial Property Types.');
  //   }
  // }

  async create(createPropertyTypeDto: CreatePropertyTypeDto): Promise<PropertyTypeDocument> {
    const { category, subCategory } = createPropertyTypeDto;

    // Check if the category + subCategory combination already exists
    const existing = await this.propertyTypeModel.findOne({ category, subCategory }).exec();
    if (existing) {
      throw new ConflictException(`Property type with category "${category}" and sub-category "${subCategory}" already exists.`);
    }

    const createdPropertyType = new this.propertyTypeModel(createPropertyTypeDto);
    return createdPropertyType.save();
  }

  async findAll(): Promise<PropertyTypeDocument[]> {
    return this.propertyTypeModel.find().exec();
  }

  async findOne(id: string): Promise<PropertyTypeDocument> {
    const propertyType = await this.propertyTypeModel.findById(id).exec();
    if (!propertyType) {
      throw new NotFoundException(`Property type with ID "${id}" not found`);
    }
    return propertyType;
  }

  async update(id: string, updatePropertyTypeDto: UpdatePropertyTypeDto): Promise<PropertyTypeDocument> {
    // If updating category or subCategory, ensure duplicate is not created
    if (updatePropertyTypeDto.category || updatePropertyTypeDto.subCategory) {
      const current = await this.propertyTypeModel.findById(id).exec();
      if (!current) {
        throw new NotFoundException(`Property type with ID "${id}" not found`);
      }

      const newCategory = updatePropertyTypeDto.category ?? current.category;
      const newSubCategory = updatePropertyTypeDto.subCategory ?? current.subCategory;

      if (newCategory !== current.category || newSubCategory !== current.subCategory) {
        const existing = await this.propertyTypeModel.findOne({
          category: newCategory,
          subCategory: newSubCategory,
          _id: { $ne: id },
        }).exec();

        if (existing) {
          throw new ConflictException(`Property type with category "${newCategory}" and sub-category "${newSubCategory}" already exists.`);
        }
      }
    }

    const updatedPropertyType = await this.propertyTypeModel.findByIdAndUpdate(
      id,
      updatePropertyTypeDto,
      { new: true },
    ).exec();

    if (!updatedPropertyType) {
      throw new NotFoundException(`Property type with ID "${id}" not found`);
    }
    return updatedPropertyType;
  }

  async remove(id: string): Promise<void> {
    const result = await this.propertyTypeModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(`Property type with ID "${id}" not found`);
    }
  }
}
