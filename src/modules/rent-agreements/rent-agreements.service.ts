import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { RentAgreement, RentAgreementDocument } from './schemas/rent-agreement.schema';
import { CreateRentAgreementDto } from './dto/create-rent-agreement.dto';
import { UpdateRentAgreementDto } from './dto/update-rent-agreement.dto';
import { QueryRentAgreementDto } from './dto/query-rent-agreement.dto';
import { Property, PropertyDocument } from '../properties/schemas/property.schema';
import { Contact, ContactDocument } from '../contacts/schemas/contact.schema';
import { ActivitiesService } from '../activities/activities.service';
import { ActivityType } from '../activities/schemas/activity.schema';

@Injectable()
export class RentAgreementsService {
  constructor(
    @InjectModel(RentAgreement.name)
    private readonly rentAgreementModel: Model<RentAgreementDocument>,
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
    createDto: CreateRentAgreementDto,
    userId?: string,
  ): Promise<RentAgreementDocument> {
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

    const newAgreement = new this.rentAgreementModel(docData);
    const saved = await newAgreement.save();

    // Fetch tenant details for activity log
    const tenant = await this.contactModel.findById(createDto.tenant).exec();
    const tenantName = tenant ? `${tenant.firstName} ${tenant.lastName || ''}`.trim() : 'a tenant';

    await this.activitiesService.log(
      `Created Rent Agreement for property at "${building}" with tenant "${tenantName}"`,
      ActivityType.RENT_AGREEMENT,
      userId,
    );

    return saved.populate(['tenant', 'property', 'createdBy', 'assignedTo']);
  }

  async findAll(
    query: QueryRentAgreementDto,
  ): Promise<{ rentAgreements: RentAgreementDocument[]; total: number }> {
    const { search, page = 1, limit = 10, sortBy = 'Create Date', orderBy = 'Desc' } = query;
    const filter: any = {};

    if (search) {
      // Find matching contact IDs first to allow searching by tenant name
      const matchingContacts = await this.contactModel.find({
        $or: [
          { firstName: new RegExp(search, 'i') },
          { lastName: new RegExp(search, 'i') },
        ]
      }, { _id: 1 }).exec();
      const contactIds = matchingContacts.map(c => c._id);

      filter.$or = [
        { tenant: { $in: contactIds } },
        { building: new RegExp(search, 'i') },
        { crNumber: new RegExp(search, 'i') },
        { inNameOf: new RegExp(search, 'i') },
      ];
    }

    const total = await this.rentAgreementModel.countDocuments(filter).exec();

    // Map query sort field to mongoose schema path
    const dir: 1 | -1 = orderBy === 'Asc' ? 1 : -1;
    const sortFieldMap: Record<string, string> = {
      'Create Date': 'createdAt',
      'Deal Date': 'agreementDate',
      Building: 'building',
    };
    const sortField = sortFieldMap[sortBy] || 'createdAt';
    const sortObj = { [sortField]: dir };

    let queryChain = this.rentAgreementModel.find(filter).sort(sortObj);

    if (limit > 0 && limit < 99999) {
      queryChain = queryChain.skip((page - 1) * limit).limit(limit);
    }

    const rentAgreements = await queryChain
      .populate(['tenant', 'property', 'createdBy', 'assignedTo'])
      .exec();

    return { rentAgreements, total };
  }

  async findOne(id: string): Promise<RentAgreementDocument> {
    const agreement = await this.rentAgreementModel
      .findById(id)
      .populate(['tenant', 'property', 'createdBy', 'assignedTo'])
      .exec();

    if (!agreement) {
      throw new NotFoundException(`Rent Agreement with ID "${id}" not found`);
    }

    return agreement;
  }

  async update(
    id: string,
    updateDto: UpdateRentAgreementDto,
    userId?: string,
  ): Promise<RentAgreementDocument> {
    const existing = await this.rentAgreementModel.findById(id).exec();
    if (!existing) {
      throw new NotFoundException(`Rent Agreement with ID "${id}" not found`);
    }

    const updateData: any = { ...updateDto };

    // If property is changed, re-sync denormalized building name
    if (updateDto.property && updateDto.property !== existing.property.toString()) {
      updateData.building = await this.getBuildingName(updateDto.property);
    }

    const updated = await this.rentAgreementModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .populate(['tenant', 'property', 'createdBy', 'assignedTo'])
      .exec();

    if (!updated) {
      throw new NotFoundException(`Rent Agreement with ID "${id}" not found`);
    }

    await this.activitiesService.log(
      `Modified Rent Agreement details for property at "${updated.building}"`,
      ActivityType.RENT_AGREEMENT,
      userId,
    );

    return updated;
  }

  async remove(id: string, userId?: string): Promise<void> {
    const agreement = await this.rentAgreementModel.findById(id).exec();
    if (!agreement) {
      throw new NotFoundException(`Rent Agreement with ID "${id}" not found`);
    }

    await this.rentAgreementModel.findByIdAndDelete(id).exec();

    await this.activitiesService.log(
      `Deleted Rent Agreement (ID: ${id}) for property at "${agreement.building}"`,
      ActivityType.RENT_AGREEMENT,
      userId,
    );
  }
}
