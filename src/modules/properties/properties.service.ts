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
import { QueryPropertyDto, GroupDeletePropertiesDto } from './dto/query-property.dto';
import { ActivitiesService } from '../activities/activities.service';
import { ActivityType } from '../activities/schemas/activity.schema';
import { Contact, ContactDocument } from '../contacts/schemas/contact.schema';
import { User, UserDocument } from '../users/schemas/user.schema';
import { generateExcelBuffer } from '../../common/utils/excel.util';
import { sanitizeBase64Payload } from '../../common/utils/base64-storage.util';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class PropertiesService implements OnModuleInit {
  constructor(
    @InjectModel(Property.name)
    private readonly propertyModel: Model<PropertyDocument>,
    @InjectModel(Contact.name)
    private readonly contactModel: Model<ContactDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
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

    if (
      mapped.assignee &&
      typeof mapped.assignee === 'string' &&
      /^[0-9a-fA-F]{24}$/.test(mapped.assignee)
    ) {
      mapped.assignedTo = mapped.assignee;
    } else if (mapped.assignee === '' || mapped.assignee === 'Select') {
      delete mapped.assignee;
    }

    return mapped;
  }

  /**
   * Process an array of image strings.
   * If an item is a Base64 data URI (data:image/...;base64,...), it decodes and writes
   * the image to `uploads/properties/photos/` and returns the static URL `/uploads/properties/photos/...`.
   * If it is already an HTTP URL or local path, it is retained as is.
   */
  async processImages(images?: string[]): Promise<string[]> {
    if (!images || !Array.isArray(images) || images.length === 0) {
      return [];
    }

    const uploadDir = path.join(process.cwd(), 'uploads', 'properties', 'photos');
    try {
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
    } catch {
      // Directory creation error handler
    }

    const processedList: string[] = [];

    for (let i = 0; i < images.length; i++) {
      const item = images[i];
      if (typeof item !== 'string' || !item.trim()) continue;

      const trimmed = item.trim();
      const base64Match = trimmed.match(/^data:image\/([a-zA-Z0-9+.-]+);base64,(.+)$/);
      if (base64Match) {
        try {
          let ext = base64Match[1].toLowerCase();
          if (ext === 'jpeg') ext = 'jpg';
          if (ext === 'svg+xml') ext = 'svg';
          const base64Data = base64Match[2];
          const buffer = Buffer.from(base64Data, 'base64');
          const fileName = `prop_${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${ext}`;
          const filePath = path.join(uploadDir, fileName);

          await fs.promises.writeFile(filePath, buffer);
          processedList.push(`/uploads/properties/photos/${fileName}`);
          continue;
        } catch {
          // If saving fails, fallback to keeping the original string
          processedList.push(trimmed);
          continue;
        }
      }

      processedList.push(trimmed);
    }

    return processedList;
  }

  async create(
    createPropertyDto: CreatePropertyDto,
    defaultUserId?: string,
  ): Promise<PropertyDocument> {
    const mappedDto = this.mapLegacyFields(createPropertyDto, true);

    // Process and synchronize photos & images
    let images = mappedDto.images || [];
    let photos = mappedDto.photos || [];

    if (photos.length > 0 && images.length === 0) {
      images = [...photos];
    } else if (images.length > 0 && photos.length === 0) {
      photos = [...images];
    }

    if (photos.length > 0) {
      mappedDto.photos = await this.processImages(photos);
    }
    if (images.length > 0) {
      mappedDto.images = await this.processImages(images);
    }
    if (mappedDto.photos?.length && (!mappedDto.images || mappedDto.images.length === 0)) {
      mappedDto.images = [...mappedDto.photos];
    } else if (mappedDto.images?.length && (!mappedDto.photos || mappedDto.photos.length === 0)) {
      mappedDto.photos = [...mappedDto.images];
    }

    // Populate createdBy and assignedTo if defaultUserId is available and they are not already set
    if (defaultUserId) {
      if (!mappedDto.createdBy) {
        mappedDto.createdBy = defaultUserId;
      }
      if (!mappedDto.assignedTo) {
        mappedDto.assignedTo = defaultUserId;
      }
    }

    const sanitizedDto = await sanitizeBase64Payload(mappedDto, 'properties');
    const newProperty = new this.propertyModel(sanitizedDto);
    const savedProperty = await newProperty.save();

    // Log the addition in activity stream
    await this.activitiesService.log(
      `Added a new property listing "${savedProperty.name}"`,
      ActivityType.PROPERTY,
    );

    return savedProperty.populate(['createdBy', 'assignedTo', 'ownerLandlord']);
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
      const orConditions: any[] = [
        { name: new RegExp(search, 'i') },
        { location: new RegExp(search, 'i') },
        { builder: new RegExp(search, 'i') },
        { type: new RegExp(search, 'i') },
      ];
      if (/^[0-9a-fA-F]{24}$/.test(search.trim())) {
        orConditions.push({ _id: search.trim() });
      }
      filter.$and.push({ $or: orConditions });
    }

    if (updatedSince) {
      filter.updatedAt = { $gte: new Date(updatedSince) };
    }

    const sortObj = this.buildSortObject(sortBy, orderBy);
    let queryChain = this.propertyModel.find(filter).sort(sortObj);

    if (limit > 0 && limit < 99999) {
      queryChain = queryChain.skip((page - 1) * limit).limit(limit);
    }

    const [properties, total] = await Promise.all([
      queryChain.populate(['createdBy', 'assignedTo', 'ownerLandlord']).exec(),
      this.propertyModel.countDocuments(filter).exec(),
    ]);
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
      const orConditions: any[] = [
        { name: new RegExp(search, 'i') },
        { location: new RegExp(search, 'i') },
        { builder: new RegExp(search, 'i') },
        { type: new RegExp(search, 'i') },
      ];
      if (/^[0-9a-fA-F]{24}$/.test(search.trim())) {
        orConditions.push({ _id: search.trim() });
      }
      filter.$and.push({ $or: orConditions });
    }

    if (updatedSince) {
      filter.updatedAt = { $gte: new Date(updatedSince) };
    }

    const sortObj = this.buildSortObject(sortBy, orderBy);
    let queryChain = this.propertyModel.find(filter).sort(sortObj);

    if (limit > 0 && limit < 99999) {
      queryChain = queryChain.skip((page - 1) * limit).limit(limit);
    }

    const [properties, total] = await Promise.all([
      queryChain.populate(['createdBy', 'assignedTo', 'ownerLandlord']).exec(),
      this.propertyModel.countDocuments(filter).exec(),
    ]);
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
      const orConditions: any[] = [
        { name: new RegExp(search, 'i') },
        { location: new RegExp(search, 'i') },
        { builder: new RegExp(search, 'i') },
        { type: new RegExp(search, 'i') },
        { keyword: new RegExp(search, 'i') },
        { websiteKeyword: new RegExp(search, 'i') },
        { description: new RegExp(search, 'i') },
        { keywords: { $in: [new RegExp(search, 'i')] } },
      ];
      if (/^[0-9a-fA-F]{24}$/.test(search.trim())) {
        orConditions.push({ _id: search.trim() });
      }
      filter.$or = orConditions;
    }

    // Sync Filter: Fetch records modified after this timestamp
    if (updatedSince) {
      filter.updatedAt = { $gte: new Date(updatedSince) };
    }

    // Pagination bypass logic: If limit is >= 99999, return all matching records at once
    const sortObj = this.buildSortObject(sortBy, orderBy);
    let queryChain = this.propertyModel.find(filter).sort(sortObj);

    if (limit > 0 && limit < 99999) {
      queryChain = queryChain.skip((page - 1) * limit).limit(limit);
    }

    const [properties, total] = await Promise.all([
      queryChain.populate(['createdBy', 'assignedTo', 'ownerLandlord']).exec(),
      this.propertyModel.countDocuments(filter).exec(),
    ]);
    return { properties, total };
  }

  async findOne(id: string): Promise<PropertyDocument> {
    const property = await this.propertyModel
      .findById(id)
      .populate(['createdBy', 'assignedTo', 'ownerLandlord'])
      .exec();
    if (!property) {
      throw new NotFoundException(`Property listing with ID "${id}" not found`);
    }
    if (!property.photos) property.photos = [];
    if (!property.images) property.images = [];
    if (!property.videos) property.videos = [];
    if (!property.keywords) property.keywords = [];
    if (!property.documents) property.documents = [];
    if (property.photos.length > 0 && property.images.length === 0) {
      property.images = [...property.photos];
    } else if (property.images.length > 0 && property.photos.length === 0) {
      property.photos = [...property.images];
    }
    return property;
  }

  async update(
    id: string,
    updatePropertyDto: UpdatePropertyDto,
  ): Promise<PropertyDocument> {
    const mappedDto = this.mapLegacyFields(updatePropertyDto, false);

    if (mappedDto.photos !== undefined || mappedDto.images !== undefined) {
      let photos = mappedDto.photos;
      let images = mappedDto.images;

      if (photos && !images) {
        images = [...photos];
      } else if (images && !photos) {
        photos = [...images];
      }

      if (photos) {
        mappedDto.photos = await this.processImages(photos);
      }
      if (images) {
        mappedDto.images = await this.processImages(images);
      }
      if (mappedDto.photos && !mappedDto.images) {
        mappedDto.images = [...mappedDto.photos];
      } else if (mappedDto.images && !mappedDto.photos) {
        mappedDto.photos = [...mappedDto.images];
      }
    }

    const sanitizedDto = await sanitizeBase64Payload(mappedDto, 'properties');
    const updatedProperty = await this.propertyModel
      .findByIdAndUpdate(id, sanitizedDto, { new: true })
      .populate(['createdBy', 'assignedTo', 'ownerLandlord'])
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

  async groupDelete(dto: GroupDeletePropertiesDto): Promise<{ success: boolean; count: number }> {
    const { propertyIds } = dto;
    if (!propertyIds || propertyIds.length === 0) {
      return { success: true, count: 0 };
    }
    const result = await this.propertyModel.deleteMany({ _id: { $in: propertyIds } }).exec();
    await this.activitiesService.log(
      `Bulk deleted ${result.deletedCount} properties from database`,
      ActivityType.PROPERTY,
    );
    return { success: true, count: result.deletedCount };
  }

  async downloadExcel(query: QueryPropertyDto): Promise<Buffer> {
    const { buffer } = await this.generatePropertiesExcel(query);
    return buffer;
  }

  async uploadToGoogleDrive(query: any, inputLimit?: number): Promise<any> {
    const { buffer, fileName } = await this.generatePropertiesExcel(query);
    return this.uploadExcelToGoogleDrive(buffer, fileName);
  }

  private async generatePropertiesExcel(query: any): Promise<{ buffer: Buffer; fileName: string }> {
    const { properties } = await this.findAll({ ...query, limit: query.limit || 99999 });

    const headers = [
      'Property ID',
      'Property Name',
      'Owner Name',
      'Location',
      'Property Type',
      'Category',
      'Transaction',
      'Price',
      'Area (Sq. Ft.)',
      'Builder',
      'Status',
      'Created At',
    ];

    const rows = properties.map((p: any) => {
      const owner = p.ownerLandlord || {};
      const ownerName = owner.firstName
        ? `${owner.firstName} ${owner.lastName || ''}`.trim()
        : (typeof p.ownerLandlord === 'string' ? p.ownerLandlord : 'Unknown');

      return [
        p.id || p._id?.toString() || '',
        p.name || '',
        ownerName,
        p.location || p.address || '',
        p.propertyType || '',
        p.category || '',
        p.transaction || '',
        p.price || '',
        p.sqft != null ? p.sqft.toString() : '',
        p.builder || '',
        p.status || '',
        p.createdAt && !isNaN(new Date(p.createdAt).getTime()) ? new Date(p.createdAt).toISOString() : '',
      ];
    });

    const buffer = await generateExcelBuffer('Properties', headers, rows);
    const fileName = `properties_export_${new Date().toISOString().slice(0, 10)}.xlsx`;
    return { buffer, fileName };
  }

  private async uploadExcelToGoogleDrive(buffer: Buffer, fileName: string): Promise<any> {
    const clientId = process.env.GOOGLE_DRIVE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_DRIVE_CLIENT_SECRET;
    const refreshToken = process.env.GOOGLE_DRIVE_REFRESH_TOKEN;

    if (clientId && clientSecret && refreshToken) {
      try {
        const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            client_id: clientId,
            client_secret: clientSecret,
            refresh_token: refreshToken,
            grant_type: 'refresh_token',
          }),
        });

        if (!tokenResponse.ok) {
          const errText = await tokenResponse.text();
          throw new Error(`Google OAuth token refresh failed: ${errText}`);
        }

        const tokenData = (await tokenResponse.json()) as any;
        const accessToken = tokenData.access_token;

        const boundary = 'foo_bar_baz';
        const metadata = {
          name: fileName,
          mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        };

        const header = [
          `--${boundary}`,
          'Content-Type: application/json; charset=UTF-8',
          '',
          JSON.stringify(metadata),
          `--${boundary}`,
          'Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          '',
          '',
        ].join('\r\n');
        const footer = `\r\n--${boundary}--\r\n`;

        const multipartBody = Buffer.concat([
          Buffer.from(header, 'utf-8'),
          buffer,
          Buffer.from(footer, 'utf-8'),
        ]);

        const uploadResponse = await fetch(
          'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': `multipart/related; boundary=${boundary}`,
              'Content-Length': multipartBody.length.toString(),
            },
            body: multipartBody,
          },
        );

        if (!uploadResponse.ok) {
          const errText = await uploadResponse.text();
          throw new Error(`Google Drive upload failed: ${errText}`);
        }

        const fileData = (await uploadResponse.json()) as any;
        return {
          success: true,
          message: 'File successfully uploaded to Google Drive!',
          fileId: fileData.id,
        };
      } catch (err: any) {
        console.error('Google Drive export simulation failed, falling back to local mock:', err);
      }
    }

    try {
      const fs = await import('fs');
      const path = await import('path');
      const backupsDir = path.join(process.cwd(), 'backups');
      if (!fs.existsSync(backupsDir)) {
        fs.mkdirSync(backupsDir, { recursive: true });
      }

      const backupFileName = `${fileName.replace('.xlsx', '')}_drive_${new Date().getTime()}.xlsx`;
      const filePath = path.join(backupsDir, backupFileName);
      fs.writeFileSync(filePath, buffer);

      const backendUrl = process.env.BACKEND_URL || 'http://localhost:3000';
      const downloadLink = `${backendUrl}/api/databackup/download/${backupFileName}`;

      return {
        success: true,
        message: 'Google Drive credentials not set in .env. Saved locally in backups folder instead.',
        fileName: backupFileName,
        webViewLink: downloadLink,
        isMock: true,
      };
    } catch (err: any) {
      console.error('Google Drive export simulation failed:', err);
      throw new Error(`Export to Google Drive failed: ${err.message}`);
    }
  }

  async importProperties(properties: any[], defaultUserId?: string): Promise<{ success: boolean; count: number }> {
    const limit = 2000;
    const slice = properties.slice(0, limit);
    const createdProperties: any[] = [];

    const defaultUser = await this.userModel.findOne().exec();
    const fallbackUserId = defaultUserId || (defaultUser ? defaultUser._id.toString() : undefined);

    const users = await this.userModel.find().exec();
    const findUserId = (assignedVal: any): string | undefined => {
      if (!assignedVal) return fallbackUserId;
      const valStr = assignedVal.toString().trim();
      if (!valStr) return fallbackUserId;

      const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(valStr);
      if (isValidObjectId) {
        return valStr;
      }

      const cleanVal = valStr.toLowerCase();
      const foundUser = users.find(
        (u) =>
          u.firstName.toLowerCase() === cleanVal ||
          u.email.toLowerCase() === cleanVal ||
          `${u.firstName} ${u.lastName || ''}`.trim().toLowerCase() === cleanVal
      );

      return foundUser ? foundUser._id.toString() : fallbackUserId;
    };

    for (const item of slice) {
      const rawMobile = (item.Owner_Mobile || item.Customer_Mobile || item.mobile || item['Customer Mobile'] || item['Owner Mobile'] || '').toString().trim();
      const name = (item.Owner_Name || item.Customer_Name || item.name || item['Customer Name'] || item['Owner Name'] || '').toString().trim();

      if (!name || !rawMobile) continue;

      const parsedPhone = parseMobileAndCountryCode(rawMobile);
      const assignedToId = findUserId(item.assignedTo || item['Assigned To']);

      let contact = await this.contactModel.findOne({
        mobile: parsedPhone.mobile,
        countryCode: parsedPhone.countryCode,
        isDeleted: { $ne: true }
      }).exec();

      if (!contact) {
        let salutation: string | undefined = undefined;
        let fName = name;
        let lName: string | undefined = undefined;

        const nameParts = name.split(/\s+/);
        if (nameParts.length > 0) {
          const firstPart = nameParts[0].replace(/\./g, '');
          const salutations = ['mr', 'mrs', 'ms', 'dr', 'prof', 'sir'];
          if (salutations.includes(firstPart.toLowerCase())) {
            salutation = nameParts[0];
            nameParts.shift();
          }
        }
        if (nameParts.length > 0) {
          fName = nameParts[0];
          nameParts.shift();
        }
        if (nameParts.length > 0) {
          lName = nameParts.join(' ');
        }

        contact = new this.contactModel({
          salutation,
          firstName: fName,
          lastName: lName,
          countryCode: parsedPhone.countryCode,
          mobile: parsedPhone.mobile,
          email: item.Customer_Email || item.email || item['Customer Email'] || item.Owner_Email || item['Owner Email'] || '',
          companyName: item.Customer_Company || item.company || item['Customer Company'] || '',
          customerType: 'Customer',
          contactType: 'Employee',
          branch: item.Branch || item.branch || 'Global Team',
          source: item.Source || item.source || 'Spreadsheet Import',
          assignedTo: assignedToId,
        });
        await contact.save();
      }

      const propertyPayload: any = {
        name: item.Property_Name || item.name || item['Property Name'] || item.title || 'Unnamed Property',
        location: item.Location || item.location || item.address || item.Address || 'Unknown Location',
        propertyType: item.Property_Type || item.propertyType || item['Property Type'] || 'Flat/Apartment',
        category: item.Category || item.category || item.Category_Property || item['Category'] || 'Residential',
        transaction: item.Transaction || item.transaction || 'New',
        price: item.Price || item.price || '',
        sqft: Number(item.Sqft || item.sqft || item['Area (Sq. Ft.)'] || item.area || 0),
        status: item.Status || item.status || 'Available',
        builder: item.Builder || item.builder || '',
        ownerLandlord: contact ? contact._id.toString() : undefined,
        createdBy: assignedToId,
        assignedTo: assignedToId,
        description: item.Description || item.description || '',
      };

      const newProperty = new this.propertyModel(propertyPayload);
      const savedProperty = await newProperty.save();
      createdProperties.push(savedProperty);
    }

    await this.activitiesService.log(
      `Bulk imported ${createdProperties.length} properties via Spreadsheet`,
      ActivityType.PROPERTY,
    );

    return { success: true, count: createdProperties.length };
  }
}

function parseMobileAndCountryCode(rawMobile: string): { countryCode: string; mobile: string } {
  const clean = (rawMobile || '').toString().trim().replace(/[-\s()]/g, '');

  if (clean.startsWith('+')) {
    if (clean.startsWith('+91')) {
      return { countryCode: '+91', mobile: clean.substring(3) };
    }
    if (clean.startsWith('+1')) {
      return { countryCode: '+1', mobile: clean.substring(2) };
    }
    if (clean.startsWith('+44')) {
      return { countryCode: '+44', mobile: clean.substring(3) };
    }
    if (clean.startsWith('+971')) {
      return { countryCode: '+971', mobile: clean.substring(4) };
    }
    
    const match = clean.match(/^(\+\d{1,4})(\d{7,15})$/);
    if (match) {
      return { countryCode: match[1], mobile: match[2] };
    }

    return { countryCode: '+91', mobile: clean.replace('+', '') };
  }

  if (clean.length === 12 && clean.startsWith('91')) {
    return { countryCode: '+91', mobile: clean.substring(2) };
  }

  if (clean.length === 10) {
    return { countryCode: '+91', mobile: clean };
  }

  return { countryCode: '+91', mobile: clean };
}
