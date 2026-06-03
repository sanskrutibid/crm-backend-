import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { SaleAgreement, SaleAgreementDocument } from './schemas/sale-agreement.schema';
import { CreateSaleAgreementDto } from './dto/create-sale-agreement.dto';
import { UpdateSaleAgreementDto } from './dto/update-sale-agreement.dto';
import { QuerySaleAgreementDto } from './dto/query-sale-agreement.dto';
import { Property, PropertyDocument } from '../properties/schemas/property.schema';
import { Contact, ContactDocument } from '../contacts/schemas/contact.schema';
import { ActivitiesService } from '../activities/activities.service';
import { ActivityType } from '../activities/schemas/activity.schema';

@Injectable()
export class SaleAgreementsService {
  constructor(
    @InjectModel(SaleAgreement.name)
    private readonly saleAgreementModel: Model<SaleAgreementDocument>,
    @InjectModel(Property.name)
    private readonly propertyModel: Model<PropertyDocument>,
    @InjectModel(Contact.name)
    private readonly contactModel: Model<ContactDocument>,
    private readonly activitiesService: ActivitiesService,
  ) {}

  /**
   * Helper to fetch building name from Property and sync it to the DTO/object
   */
  private async getBuildingName(propertyId: string): Promise<string> {
    const property = await this.propertyModel.findById(propertyId).exec();
    if (!property) {
      throw new NotFoundException(`Property with ID "${propertyId}" not found`);
    }
    return property.buildingTowerProject || property.name || 'Unknown Building';
  }

  async create(
    createDto: CreateSaleAgreementDto,
    userId?: string,
  ): Promise<SaleAgreementDocument> {
    const building = await this.getBuildingName(createDto.property);

    const docData: any = {
      ...createDto,
      building,
    };

    if (userId) {
      docData.createdBy = userId;
      if (!docData.assignedTo) {
        docData.assignedTo = userId;
      }
    }

    const newAgreement = new this.saleAgreementModel(docData);
    const saved = await newAgreement.save();

    // Fetch buyer details for activity log
    const buyer = await this.contactModel.findById(createDto.buyer).exec();
    const buyerName = buyer ? `${buyer.firstName} ${buyer.lastName || ''}`.trim() : 'a client';

    await this.activitiesService.log(
      `Created Sale Agreement for property at "${building}" with buyer "${buyerName}"`,
      ActivityType.SALE_AGREEMENT,
      userId,
    );

    return saved.populate(['buyer', 'property', 'createdBy', 'assignedTo']);
  }

  async findAll(
    query: QuerySaleAgreementDto,
  ): Promise<{ saleAgreements: SaleAgreementDocument[]; total: number }> {
    const { search, page = 1, limit = 10, sortBy = 'Create Date', orderBy = 'Desc' } = query;
    const filter: any = {};

    if (search) {
      // Find matching contact IDs first to allow searching by buyer name
      const matchingContacts = await this.contactModel.find({
        $or: [
          { firstName: new RegExp(search, 'i') },
          { lastName: new RegExp(search, 'i') },
        ]
      }, { _id: 1 }).exec();
      const contactIds = matchingContacts.map(c => c._id);

      filter.$or = [
        { buyer: { $in: contactIds } },
        { building: new RegExp(search, 'i') },
        { crNumber: new RegExp(search, 'i') },
        { inNameOf: new RegExp(search, 'i') },
      ];
    }

    const total = await this.saleAgreementModel.countDocuments(filter).exec();

    // Map query sort field to mongoose schema path
    const dir: 1 | -1 = orderBy === 'Asc' ? 1 : -1;
    const sortFieldMap: Record<string, string> = {
      'Create Date': 'createdAt',
      'Deal Date': 'agreementDate',
      Building: 'building',
    };
    const sortField = sortFieldMap[sortBy] || 'createdAt';
    const sortObj = { [sortField]: dir };

    let queryChain = this.saleAgreementModel.find(filter).sort(sortObj);

    if (limit > 0 && limit < 99999) {
      queryChain = queryChain.skip((page - 1) * limit).limit(limit);
    }

    const saleAgreements = await queryChain
      .populate(['buyer', 'property', 'createdBy', 'assignedTo'])
      .exec();

    return { saleAgreements, total };
  }

  async findOne(id: string): Promise<SaleAgreementDocument> {
    const agreement = await this.saleAgreementModel
      .findById(id)
      .populate(['buyer', 'property', 'createdBy', 'assignedTo'])
      .exec();

    if (!agreement) {
      throw new NotFoundException(`Sale Agreement with ID "${id}" not found`);
    }

    return agreement;
  }

  async update(
    id: string,
    updateDto: UpdateSaleAgreementDto,
    userId?: string,
  ): Promise<SaleAgreementDocument> {
    const existing = await this.saleAgreementModel.findById(id).exec();
    if (!existing) {
      throw new NotFoundException(`Sale Agreement with ID "${id}" not found`);
    }

    const updateData: any = { ...updateDto };

    // If property is changed, re-sync denormalized building name
    if (updateDto.property && updateDto.property !== existing.property.toString()) {
      updateData.building = await this.getBuildingName(updateDto.property);
    }

    const updated = await this.saleAgreementModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .populate(['buyer', 'property', 'createdBy', 'assignedTo'])
      .exec();

    if (!updated) {
      throw new NotFoundException(`Sale Agreement with ID "${id}" not found`);
    }

    await this.activitiesService.log(
      `Modified Sale Agreement details for property at "${updated.building}"`,
      ActivityType.SALE_AGREEMENT,
      userId,
    );

    return updated;
  }

  async remove(id: string, userId?: string): Promise<void> {
    const agreement = await this.saleAgreementModel.findById(id).exec();
    if (!agreement) {
      throw new NotFoundException(`Sale Agreement with ID "${id}" not found`);
    }

    await this.saleAgreementModel.findByIdAndDelete(id).exec();

    await this.activitiesService.log(
      `Deleted Sale Agreement (ID: ${id}) for property at "${agreement.building}"`,
      ActivityType.SALE_AGREEMENT,
      userId,
    );
  }
}
