/* eslint-disable @typescript-eslint/no-unsafe-assignment,
   @typescript-eslint/no-unsafe-member-access,
   @typescript-eslint/no-unsafe-call,
   @typescript-eslint/no-unsafe-argument
*/

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

import {
  QueryPropertyDto,
  GroupDeletePropertiesDto,
} from './dto/query-property.dto';

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
   * Automatically seed initial premium real-estate properties
   * if the database collection is empty.
   */
  async onModuleInit(): Promise<void> {
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
   * Safe auto-mapping from new multi-step wizard fields
   * to legacy base properties.
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

          mapped.price = `₹${(
            mapped.expectedPrice / 10000000
          ).toFixed(2)} Cr${mode}`;
        } else {
          mapped.price = '₹0';
        }
      }

      if (mapped.sqft === undefined || mapped.sqft === null) {
        mapped.sqft =
          mapped.area ||
          mapped.builtUpArea ||
          mapped.carpetArea ||
          0;
      }

      if (!mapped.builder) {
        mapped.builder =
          mapped.projectDeveloperName || 'Unknown Builder';
      }
    } else {
      if (mapped.projectDeveloperName || mapped.buildingTowerProject) {
        mapped.name =
          mapped.projectDeveloperName ||
          mapped.buildingTowerProject;
      }

      if (mapped.address || mapped.locality || mapped.city) {
        mapped.location =
          mapped.address ||
          mapped.locality ||
          mapped.city;
      }

      if (mapped.propertyType) {
        mapped.type = mapped.propertyType;
      }

      if (
        mapped.expectedPrice !== undefined &&
        mapped.expectedPrice !== null
      ) {
        const mode = mapped.priceMode
          ? ` (${mapped.priceMode})`
          : '';

        mapped.price = `₹${(
          mapped.expectedPrice / 10000000
        ).toFixed(2)} Cr${mode}`;
      }

      if (
        mapped.area !== undefined &&
        mapped.area !== null
      ) {
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
    } else if (
      mapped.assignee === '' ||
      mapped.assignee === 'Select'
    ) {
      delete mapped.assignee;
    }

    return mapped;
  }

  /**
   * Process an array of image strings.
   *
   * Base64 images are saved to:
   * uploads/properties/photos/
   */
  async processImages(images?: any[]): Promise<string[]> {
    if (
      !images ||
      !Array.isArray(images) ||
      images.length === 0
    ) {
      return [];
    }

    const uploadDir = path.join(
      process.cwd(),
      'uploads',
      'properties',
      'photos',
    );

    try {
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
    } catch {
      // Directory creation error handler
    }

    const processedList: string[] = [];

    for (let i = 0; i < images.length; i++) {
      let item = images[i];

      if (!item) {
        continue;
      }

      if (typeof item === 'object') {
        item =
          item.url ||
          item.path ||
          item.src ||
          item.link ||
          JSON.stringify(item);
      }

      if (
        typeof item !== 'string' ||
        !item.trim()
      ) {
        continue;
      }

      const trimmed = item.trim();

      const base64Match = trimmed.match(
        /^data:image\/([a-zA-Z0-9+.-]+);base64,(.+)$/,
      );

      if (base64Match) {
        try {
          let ext = base64Match[1].toLowerCase();

          if (ext === 'jpeg') {
            ext = 'jpg';
          }

          if (ext === 'svg+xml') {
            ext = 'svg';
          }

          const base64Data = base64Match[2];

          const buffer = Buffer.from(
            base64Data,
            'base64',
          );

          const fileName = `prop_${Date.now()}_${Math.random()
            .toString(36)
            .substring(2, 9)}.${ext}`;

          const filePath = path.join(
            uploadDir,
            fileName,
          );

          await fs.promises.writeFile(
            filePath,
            buffer,
          );

          processedList.push(
            `/uploads/properties/photos/${fileName}`,
          );

          continue;
        } catch {
          processedList.push(trimmed);
          continue;
        }
      }

      processedList.push(trimmed);
    }

    return processedList;
  }

  /**
   * Process a single document item (string/base64/object).
   *
   * If it is a Base64 data URI (data:...;base64,...),
   * it decodes and writes the file to uploads/properties/documents/
   * and returns the static URL /uploads/properties/documents/....
   */
  async processDocumentFile(
    documentInput?: any,
  ): Promise<string | undefined> {
    if (!documentInput) return undefined;

    let strVal = '';

    if (typeof documentInput === 'string') {
      strVal = documentInput;
    } else if (typeof documentInput === 'object') {
      strVal =
        documentInput.url ||
        documentInput.path ||
        documentInput.src ||
        documentInput.link ||
        documentInput.data ||
        '';
    }

    if (!strVal || typeof strVal !== 'string') {
      return undefined;
    }

    const trimmed = strVal.trim();

    if (!trimmed) {
      return undefined;
    }

    const base64Match = trimmed.match(
      /^data:([a-zA-Z0-9+\/.-]+);base64,([\s\S]+)$/,
    );

    if (base64Match) {
      const uploadDir = path.join(
        process.cwd(),
        'uploads',
        'properties',
        'documents',
      );

      try {
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, {
            recursive: true,
          });
        }
      } catch {}

      try {
        const mime = base64Match[1].toLowerCase();

        let ext = 'pdf';

        if (mime.includes('pdf')) {
          ext = 'pdf';
        } else if (mime.includes('png')) {
          ext = 'png';
        } else if (
          mime.includes('jpg') ||
          mime.includes('jpeg')
        ) {
          ext = 'jpg';
        } else if (mime.includes('webp')) {
          ext = 'webp';
        } else if (
          mime.includes('word') ||
          mime.includes('docx')
        ) {
          ext = 'docx';
        } else if (mime.includes('doc')) {
          ext = 'doc';
        } else if (
          mime.includes('text') ||
          mime.includes('plain')
        ) {
          ext = 'txt';
        }

        const base64Data = base64Match[2].replace(
          /[\r\n\s]/g,
          '',
        );

        const buffer = Buffer.from(
          base64Data,
          'base64',
        );

        const fileName = `doc_${Date.now()}_${Math.random()
          .toString(36)
          .substring(2, 9)}.${ext}`;

        const filePath = path.join(
          uploadDir,
          fileName,
        );

        await fs.promises.writeFile(
          filePath,
          buffer,
        );

        return `/uploads/properties/documents/${fileName}`;
      } catch (err) {
        console.error(
          'Failed to save base64 document file:',
          err,
        );
      }
    }

    return trimmed;
  }

  /**
   * Save legalDocuments (7/12, 8A, Nakasha, Tax Receipt, KML, custom docs).
   *
   * Base64 data URIs are written to:
   * uploads/properties/documents/
   *
   * Existing URLs/paths are kept.
   *
   * Expected document shape:
   * {
   *   name: '7/12 Extract',
   *   type: '7/12',
   *   url: 'data:application/pdf;base64,...',
   *   size: '12345',
   *   date: '2026-01-01'
   * }
   */
  private async processLegalDocuments(
    docs?: any[],
  ): Promise<any[] | undefined> {
    if (!Array.isArray(docs)) {
      return undefined;
    }

    const uploadDir = path.join(
      process.cwd(),
      'uploads',
      'properties',
      'documents',
    );

    try {
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, {
          recursive: true,
        });
      }
    } catch {
      // Directory creation error handler
    }

    const allowedExt = [
      'pdf',
      'png',
      'jpg',
      'jpeg',
      'webp',
      'gif',
      'doc',
      'docx',
      'kml',
    ];

    const mimeToExt: Record<string, string> = {
      'application/pdf': 'pdf',
      'image/png': 'png',
      'image/jpeg': 'jpg',
      'image/jpg': 'jpg',
      'image/webp': 'webp',
      'image/gif': 'gif',
      'application/msword': 'doc',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        'docx',
      'application/vnd.google-earth.kml+xml': 'kml',
    };

    const result: any[] = [];

    for (const doc of docs) {
      if (!doc || typeof doc !== 'object') {
        continue;
      }

      let url = (
        doc.url ||
        doc.data ||
        doc.path ||
        ''
      )
        .toString()
        .trim();

      if (!url) {
        continue;
      }

      const match = url.match(
        /^data:([^;,]*)[^,]*?;base64,([\s\S]+)$/,
      );

      if (match) {
        try {
          const mime = (
            match[1] || ''
          ).toLowerCase();

          let ext = '';

          const nameExt = (
            doc.name || ''
          ).match(
            /\.([a-zA-Z0-9]{2,5})$/,
          );

          if (
            nameExt &&
            allowedExt.includes(
              nameExt[1].toLowerCase(),
            )
          ) {
            ext =
              nameExt[1].toLowerCase();
          } else if (mimeToExt[mime]) {
            ext = mimeToExt[mime];
          } else {
            ext = 'pdf';
          }

          const buffer = Buffer.from(
            match[2].replace(
              /[\r\n\s]/g,
              '',
            ),
            'base64',
          );

          const fileName = `legal_${Date.now()}_${Math.random()
            .toString(36)
            .substring(2, 9)}.${ext}`;

          await fs.promises.writeFile(
            path.join(
              uploadDir,
              fileName,
            ),
            buffer,
          );

          url = `/uploads/properties/documents/${fileName}`;
        } catch (err) {
          console.error(
            'Failed to save legal document file:',
            err,
          );
        }
      } else if (
        url.startsWith('http://') ||
        url.startsWith('https://')
      ) {
        // Store only the relative path so it works on any server host.
        const idx = url.indexOf(
          '/uploads/',
        );

        if (idx > -1) {
          url = url.substring(idx);
        }
      }

      result.push({
        name:
          doc.name ||
          'Document',

        type:
          doc.type ||
          'Legal Document',

        url,

        size:
          doc.size ||
          '',

        date:
          doc.date ||
          '',
      });
    }

    return result;
  }

  async processVideos(videos?: any[]): Promise<any[]> {
    if (
      !videos ||
      !Array.isArray(videos) ||
      videos.length === 0
    ) {
      return [];
    }

    const uploadDir = path.join(
      process.cwd(),
      'uploads',
      'properties',
      'videos',
    );

    try {
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, {
          recursive: true,
        });
      }
    } catch {
      // Directory creation error handler
    }

    const processedList: any[] = [];

    for (let i = 0; i < videos.length; i++) {
      let item = videos[i];

      if (!item) continue;

      let strVal = '';

      if (typeof item === 'string') {
        strVal = item;
      } else if (typeof item === 'object') {
        strVal =
          item.url ||
          item.path ||
          item.src ||
          item.link ||
          item.data ||
          '';
      }

      const trimmed = strVal ? strVal.trim() : '';

      if (trimmed) {
        const base64Match = trimmed.match(
          /^data:(video|application)\/([a-zA-Z0-9+.-]+);base64,([\s\S]+)$/,
        );

        if (base64Match) {
          try {
            let ext = base64Match[2].toLowerCase();

            if (ext.includes('mp4')) {
              ext = 'mp4';
            } else if (ext.includes('webm')) {
              ext = 'webm';
            } else if (
              ext.includes('quicktime') ||
              ext.includes('mov')
            ) {
              ext = 'mov';
            } else if (ext.includes('avi')) {
              ext = 'avi';
            } else if (ext.includes('mkv')) {
              ext = 'mkv';
            } else if (
              ext.includes('ogg') ||
              ext.includes('ogv')
            ) {
              ext = 'mp4';
            } else {
              ext = 'mp4';
            }

            const base64Data =
              base64Match[3].replace(
                /[\r\n\s]/g,
                '',
              );

            const buffer = Buffer.from(
              base64Data,
              'base64',
            );

            const fileName = `prop_vid_${Date.now()}_${Math.random()
              .toString(36)
              .substring(2, 9)}.${ext}`;

            const filePath = path.join(
              uploadDir,
              fileName,
            );

            await fs.promises.writeFile(
              filePath,
              buffer,
            );

            const relativeUrl = `/uploads/properties/videos/${fileName}`;

            if (typeof item === 'object') {
              processedList.push({
                ...item,
                url: relativeUrl,
                path: relativeUrl,
                link: relativeUrl,
              });
            } else {
              processedList.push(relativeUrl);
            }

            continue;
          } catch (err) {
            console.error(
              'Failed to save base64 video file:',
              err,
            );
          }
        }
      }

      processedList.push(item);
    }

    return processedList;
  }

  async create(
    createPropertyDto: CreatePropertyDto,
    defaultUserId?: string,
  ): Promise<PropertyDocument> {
    const mappedDto = this.mapLegacyFields(
      createPropertyDto,
      true,
    );

    let images = mappedDto.images || [];
    let photos = mappedDto.photos || [];

    if (
      photos.length > 0 &&
      images.length === 0
    ) {
      images = [...photos];
    } else if (
      images.length > 0 &&
      photos.length === 0
    ) {
      photos = [...images];
    }

    if (photos.length > 0) {
      mappedDto.photos =
        await this.processImages(photos);
    }

    if (images.length > 0) {
      mappedDto.images =
        await this.processImages(images);
    }

    if (
      mappedDto.photos?.length &&
      (!mappedDto.images ||
        mappedDto.images.length === 0)
    ) {
      mappedDto.images = [...mappedDto.photos];
    } else if (
      mappedDto.images?.length &&
      (!mappedDto.photos ||
        mappedDto.photos.length === 0)
    ) {
      mappedDto.photos = [...mappedDto.images];
    }

    // Process and synchronize property videos
    let videos = mappedDto.videos || [];

    if (videos.length > 0) {
      mappedDto.videos =
        await this.processVideos(videos);
    }

    if (
      mappedDto.videoUrl &&
      mappedDto.videoUrl.startsWith('data:')
    ) {
      const processed =
        await this.processVideos([
          mappedDto.videoUrl,
        ]);

      if (processed.length > 0) {
        mappedDto.videoUrl =
          typeof processed[0] === 'string'
            ? processed[0]
            : processed[0].url ||
              processed[0].path;
      }
    }

    if (
      mappedDto.virtualVideoUrl &&
      mappedDto.virtualVideoUrl.startsWith('data:')
    ) {
      const processed =
        await this.processVideos([
          mappedDto.virtualVideoUrl,
        ]);

      if (processed.length > 0) {
        mappedDto.virtualVideoUrl =
          typeof processed[0] === 'string'
            ? processed[0]
            : processed[0].url ||
              processed[0].path;
      }
    }

    if (
      mappedDto.videos?.length &&
      !mappedDto.videoUrl
    ) {
      const firstVid = mappedDto.videos[0];

      mappedDto.videoUrl =
        typeof firstVid === 'string'
          ? firstVid
          : firstVid?.url ||
            firstVid?.path ||
            '';
    } else if (
      mappedDto.videoUrl &&
      (!mappedDto.videos ||
        mappedDto.videos.length === 0)
    ) {
      mappedDto.videos = [
        {
          url: mappedDto.videoUrl,
          title: 'Main Property Video',
        },
      ];
    }

    // Populate createdBy and assignedTo if defaultUserId is available
    // and they are not already set
    if (defaultUserId) {
      if (!mappedDto.createdBy) {
        mappedDto.createdBy = defaultUserId;
      }

      if (!mappedDto.assignedTo) {
        mappedDto.assignedTo = defaultUserId;
      }
    }

    // Process Certificate Documents
    if (mappedDto.completionCertificateDoc) {
      mappedDto.completionCertificateDoc =
        await this.processDocumentFile(
          mappedDto.completionCertificateDoc,
        );
    }

    if (mappedDto.occupationCertificateDoc) {
      mappedDto.occupationCertificateDoc =
        await this.processDocumentFile(
          mappedDto.occupationCertificateDoc,
        );
    }

    if (mappedDto.nocCertificateDoc) {
      mappedDto.nocCertificateDoc =
        await this.processDocumentFile(
          mappedDto.nocCertificateDoc,
        );
    }

    if (mappedDto.fireCertificateDoc) {
      mappedDto.fireCertificateDoc =
        await this.processDocumentFile(
          mappedDto.fireCertificateDoc,
        );
    }

    /**
     * Process Legal Documents
     *
     * Handles:
     * - 7/12
     * - 8A
     * - Nakasha
     * - Tax Receipt
     * - KML
     * - Custom documents
     *
     * Base64 files are saved to:
     * uploads/properties/documents/
     */
    if (
      Array.isArray(mappedDto.legalDocuments)
    ) {
      mappedDto.legalDocuments =
        await this.processLegalDocuments(
          mappedDto.legalDocuments,
        );
    }

    const sanitizedDto =
      await sanitizeBase64Payload(
        mappedDto,
        'properties',
      );

    const newProperty =
      new this.propertyModel(sanitizedDto);

    const savedProperty =
      await newProperty.save();

    await this.activitiesService.log(
      `Added a new property listing "${savedProperty.name}"`,
      ActivityType.PROPERTY,
    );

    return savedProperty.populate([
      'createdBy',
      'assignedTo',
      'ownerLandlord',
    ]);
  }

  private buildSortObject(
    sortBy: string = 'Create Date',
    orderBy: 'Asc' | 'Desc' = 'Desc',
  ): Record<string, 1 | -1> {
    const dir: 1 | -1 =
      orderBy === 'Asc' ? 1 : -1;

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

    const field =
      fieldMap[sortBy] ?? 'createdAt';

    return {
      [field]: dir,
    };
  }

  async getMyProperties(
    query: QueryPropertyDto,
    userId?: string | null,
  ): Promise<{
    properties: PropertyDocument[];
    total: number;
  }> {
    const {
      status,
      search,
      updatedSince,
      page = 1,
      limit = 10,
      sortBy = 'Create Date',
      orderBy = 'Desc',
    } = query;

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

      if (
        /^[0-9a-fA-F]{24}$/.test(
          search.trim(),
        )
      ) {
        orConditions.push({
          _id: search.trim(),
        });
      }

      filter.$and.push({
        $or: orConditions,
      });
    }

    if (updatedSince) {
      filter.updatedAt = {
        $gte: new Date(updatedSince),
      };
    }

    const sortObj = this.buildSortObject(
      sortBy,
      orderBy,
    );

    let queryChain =
      this.propertyModel
        .find(filter)
        .sort(sortObj);

    if (
      limit > 0 &&
      limit < 99999
    ) {
      queryChain = queryChain
        .skip((page - 1) * limit)
        .limit(limit);
    }

    const [properties, total] =
      await Promise.all([
        queryChain
          .populate([
            'createdBy',
            'assignedTo',
            'ownerLandlord',
          ])
          .exec(),

        this.propertyModel
          .countDocuments(filter)
          .exec(),
      ]);

    return {
      properties,
      total,
    };
  }

  async getAvailableProperties(
    query: QueryPropertyDto,
  ): Promise<{
    properties: PropertyDocument[];
    total: number;
  }> {
    const {
      search,
      updatedSince,
      page = 1,
      limit = 10,
      sortBy = 'Create Date',
      orderBy = 'Desc',
    } = query;

    const filter: any = {
      status: PropertyStatus.AVAILABLE,
    };

    if (search) {
      filter.$and = filter.$and || [];

      const orConditions: any[] = [
        { name: new RegExp(search, 'i') },
        { location: new RegExp(search, 'i') },
        { builder: new RegExp(search, 'i') },
        { type: new RegExp(search, 'i') },
      ];

      if (
        /^[0-9a-fA-F]{24}$/.test(
          search.trim(),
        )
      ) {
        orConditions.push({
          _id: search.trim(),
        });
      }

      filter.$and.push({
        $or: orConditions,
      });
    }

    if (updatedSince) {
      filter.updatedAt = {
        $gte: new Date(updatedSince),
      };
    }

    const sortObj = this.buildSortObject(
      sortBy,
      orderBy,
    );

    let queryChain =
      this.propertyModel
        .find(filter)
        .sort(sortObj);

    if (
      limit > 0 &&
      limit < 99999
    ) {
      queryChain = queryChain
        .skip((page - 1) * limit)
        .limit(limit);
    }

    const [properties, total] =
      await Promise.all([
        queryChain
          .populate([
            'createdBy',
            'assignedTo',
            'ownerLandlord',
          ])
          .exec(),

        this.propertyModel
          .countDocuments(filter)
          .exec(),
      ]);

    return {
      properties,
      total,
    };
  }

  async findAll(
    query: QueryPropertyDto,
  ): Promise<{
    properties: PropertyDocument[];
    total: number;
  }> {
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
        {
          websiteKeyword: new RegExp(
            search,
            'i',
          ),
        },
        {
          description: new RegExp(
            search,
            'i',
          ),
        },
        {
          keywords: {
            $in: [
              new RegExp(search, 'i'),
            ],
          },
        },
      ];

      if (
        /^[0-9a-fA-F]{24}$/.test(
          search.trim(),
        )
      ) {
        orConditions.push({
          _id: search.trim(),
        });
      }

      filter.$or = orConditions;
    }

    if (updatedSince) {
      filter.updatedAt = {
        $gte: new Date(updatedSince),
      };
    }

    const sortObj = this.buildSortObject(
      sortBy,
      orderBy,
    );

    let queryChain =
      this.propertyModel
        .find(filter)
        .sort(sortObj);

    if (
      limit > 0 &&
      limit < 99999
    ) {
      queryChain = queryChain
        .skip((page - 1) * limit)
        .limit(limit);
    }

    const [properties, total] =
      await Promise.all([
        queryChain
          .populate([
            'createdBy',
            'assignedTo',
            'ownerLandlord',
          ])
          .exec(),

        this.propertyModel
          .countDocuments(filter)
          .exec(),
      ]);

    return {
      properties,
      total,
    };
  }

  async findOne(
    id: string,
  ): Promise<PropertyDocument> {
    const property =
      await this.propertyModel
        .findById(id)
        .populate([
          'createdBy',
          'assignedTo',
          'ownerLandlord',
        ])
        .exec();

    if (!property) {
      throw new NotFoundException(
        `Property listing with ID "${id}" not found`,
      );
    }

    if (!property.photos) {
      property.photos = [];
    }

    if (!property.images) {
      property.images = [];
    }

    if (!property.videos) {
      property.videos = [];
    }

    if (!property.keywords) {
      property.keywords = [];
    }

    if (!property.documents) {
      property.documents = [];
    }

    if (
      property.photos.length > 0 &&
      property.images.length === 0
    ) {
      property.images = [
        ...property.photos,
      ];
    } else if (
      property.images.length > 0 &&
      property.photos.length === 0
    ) {
      property.photos = [
        ...property.images,
      ];
    }

    if (
      property.videos.length > 0 &&
      !property.videoUrl
    ) {
      const firstVid = property.videos[0];

      property.videoUrl =
        typeof firstVid === 'string'
          ? firstVid
          : (firstVid as any)?.url ||
            (firstVid as any)?.path ||
            '';
    } else if (
      property.videoUrl &&
      (!property.videos ||
        property.videos.length === 0)
    ) {
      property.videos = [
        {
          url: property.videoUrl,
          title: 'Main Property Video',
        },
      ];
    }

    return property;
  }

  async getShareDetails(
    id: string,
    baseUrl?: string,
  ) {
    const property = await this.findOne(id);

    const host = (baseUrl || '').replace(
      /\/$/,
      '',
    );

    const formatUrl = (url?: string) => {
      if (!url) return '';

      if (
        url.startsWith('http://') ||
        url.startsWith('https://')
      ) {
        return url;
      }

      if (url.startsWith('/')) {
        return host ? `${host}${url}` : url;
      }

      return url;
    };

    const photos = (
      property.photos ||
      property.images ||
      []
    ).map((p: string) =>
      formatUrl(p),
    );

    const videos = (
      property.videos || []
    ).map((v: any) => {
      const urlStr =
        typeof v === 'string'
          ? v
          : v?.url ||
            v?.path ||
            v?.link ||
            '';

      const formatted = formatUrl(urlStr);

      return typeof v === 'object'
        ? { ...v, url: formatted }
        : formatted;
    });

    let mainVideoUrl = formatUrl(
      property.videoUrl ||
        property.virtualVideoUrl ||
        '',
    );

    if (
      !mainVideoUrl &&
      videos.length > 0
    ) {
      mainVideoUrl =
        typeof videos[0] === 'string'
          ? videos[0]
          : videos[0]?.url || '';
    }

    const title =
      property.name ||
      'Property Listing';

    const type =
      property.propertyType ||
      property.type ||
      'Real Estate';

    const transaction =
      property.transaction ||
      'Available';

    const price =
      property.price ||
      (property.expectedPrice
        ? `₹${property.expectedPrice}`
        : 'Price on Request');

    const location =
      property.location ||
      property.address ||
      property.locality ||
      property.city ||
      '';

    const area =
      property.sqft ||
      property.area ||
      property.builtUpArea ||
      property.carpetArea
        ? `${
            property.sqft ||
            property.area ||
            property.builtUpArea ||
            property.carpetArea
          } sq.ft.`
        : '';

    const bedroom = property.bedroom
      ? `${property.bedroom} BHK`
      : '';

    const description =
      property.description ||
      property.remark ||
      '';

    const amenities =
      property.amenities &&
      property.amenities.length > 0
        ? property.amenities.join(', ')
        : '';

    let formattedShareText =
      `🏠 *${title}*\n`;

    if (location) {
      formattedShareText +=
        `📍 *Location:* ${location}\n`;
    }

    if (type) {
      formattedShareText +=
        `🏷️ *Category:* ${type} (${transaction})\n`;
    }

    if (price) {
      formattedShareText +=
        `💰 *Price:* ${price}\n`;
    }

    if (bedroom) {
      formattedShareText +=
        `🛏️ *Configuration:* ${bedroom}\n`;
    }

    if (area) {
      formattedShareText +=
        `📐 *Area:* ${area}\n`;
    }

    if (amenities) {
      formattedShareText +=
        `✨ *Amenities:* ${amenities}\n`;
    }

    if (description) {
      formattedShareText +=
        `\n📝 *Description:* ${description}\n`;
    }

    if (photos.length > 0) {
      formattedShareText +=
        `\n📸 *Property Photos (${photos.length}):*\n`;

      photos
        .slice(0, 5)
        .forEach(
          (
            p: string,
            idx: number,
          ) => {
            formattedShareText +=
              `• Photo ${idx + 1}: ${p}\n`;
          },
        );
    }

    if (
      mainVideoUrl ||
      videos.length > 0
    ) {
      formattedShareText +=
        `\n🎥 *Property Video Preview:*\n`;

      if (mainVideoUrl) {
        formattedShareText +=
          `▶️ Watch Video: ${mainVideoUrl}\n`;
      }

      videos.forEach(
        (
          v: any,
          idx: number,
        ) => {
          const vUrl =
            typeof v === 'string'
              ? v
              : v?.url;

          if (
            vUrl &&
            vUrl !== mainVideoUrl
          ) {
            formattedShareText +=
              `▶️ Video ${idx + 1}: ${vUrl}\n`;
          }
        },
      );
    }

    return {
      property,
      photos,
      videos,
      mainVideoUrl,
      virtualVideoUrl: formatUrl(
        property.virtualVideoUrl,
      ),
      formattedShareText,
    };
  }

  async update(
    id: string,
    updatePropertyDto: UpdatePropertyDto,
  ): Promise<PropertyDocument> {
    const mappedDto =
      this.mapLegacyFields(
        updatePropertyDto,
        false,
      );

    if (
      mappedDto.photos !== undefined ||
      mappedDto.images !== undefined
    ) {
      let photos = mappedDto.photos;
      let images = mappedDto.images;

      if (photos && !images) {
        images = [...photos];
      } else if (
        images &&
        !photos
      ) {
        photos = [...images];
      }

      if (photos) {
        mappedDto.photos =
          await this.processImages(
            photos,
          );
      }

      if (images) {
        mappedDto.images =
          await this.processImages(
            images,
          );
      }

      if (
        mappedDto.photos &&
        !mappedDto.images
      ) {
        mappedDto.images = [
          ...mappedDto.photos,
        ];
      } else if (
        mappedDto.images &&
        !mappedDto.photos
      ) {
        mappedDto.photos = [
          ...mappedDto.images,
        ];
      }
    }

    if (
      mappedDto.videos !== undefined ||
      mappedDto.videoUrl !== undefined ||
      mappedDto.virtualVideoUrl !== undefined
    ) {
      if (
        mappedDto.videos &&
        mappedDto.videos.length > 0
      ) {
        mappedDto.videos =
          await this.processVideos(
            mappedDto.videos,
          );
      }

      if (
        mappedDto.videoUrl &&
        mappedDto.videoUrl.startsWith('data:')
      ) {
        const processed =
          await this.processVideos([
            mappedDto.videoUrl,
          ]);

        if (processed.length > 0) {
          mappedDto.videoUrl =
            typeof processed[0] === 'string'
              ? processed[0]
              : processed[0].url ||
                processed[0].path;
        }
      }

      if (
        mappedDto.virtualVideoUrl &&
        mappedDto.virtualVideoUrl.startsWith('data:')
      ) {
        const processed =
          await this.processVideos([
            mappedDto.virtualVideoUrl,
          ]);

        if (processed.length > 0) {
          mappedDto.virtualVideoUrl =
            typeof processed[0] === 'string'
              ? processed[0]
              : processed[0].url ||
                processed[0].path;
        }
      }

      if (
        mappedDto.videos?.length &&
        !mappedDto.videoUrl
      ) {
        const firstVid =
          mappedDto.videos[0];

        mappedDto.videoUrl =
          typeof firstVid === 'string'
            ? firstVid
            : firstVid?.url ||
              firstVid?.path ||
              '';
      } else if (
        mappedDto.videoUrl &&
        (!mappedDto.videos ||
          mappedDto.videos.length === 0)
      ) {
        mappedDto.videos = [
          {
            url: mappedDto.videoUrl,
            title: 'Main Property Video',
          },
        ];
      }
    }

    // Process Certificate Documents
    if (mappedDto.completionCertificateDoc) {
      mappedDto.completionCertificateDoc =
        await this.processDocumentFile(
          mappedDto.completionCertificateDoc,
        );
    }

    if (mappedDto.occupationCertificateDoc) {
      mappedDto.occupationCertificateDoc =
        await this.processDocumentFile(
          mappedDto.occupationCertificateDoc,
        );
    }

    if (mappedDto.nocCertificateDoc) {
      mappedDto.nocCertificateDoc =
        await this.processDocumentFile(
          mappedDto.nocCertificateDoc,
        );
    }

    if (mappedDto.fireCertificateDoc) {
      mappedDto.fireCertificateDoc =
        await this.processDocumentFile(
          mappedDto.fireCertificateDoc,
        );
    }

    /**
     * Process Legal Documents
     *
     * Handles:
     * - 7/12
     * - 8A
     * - Nakasha
     * - Tax Receipt
     * - KML
     * - Custom documents
     */
    if (
      Array.isArray(mappedDto.legalDocuments)
    ) {
      mappedDto.legalDocuments =
        await this.processLegalDocuments(
          mappedDto.legalDocuments,
        );
    }

    const sanitizedDto =
      await sanitizeBase64Payload(
        mappedDto,
        'properties',
      );

    const updatedProperty =
      await this.propertyModel
        .findByIdAndUpdate(
          id,
          sanitizedDto,
          { new: true },
        )
        .populate([
          'createdBy',
          'assignedTo',
          'ownerLandlord',
        ])
        .exec();

    if (!updatedProperty) {
      throw new NotFoundException(
        `Property listing with ID "${id}" not found`,
      );
    }

    await this.activitiesService.log(
      `Modified property listing details: "${updatedProperty.name}"`,
      ActivityType.PROPERTY,
    );

    return updatedProperty;
  }

  async remove(
    id: string,
  ): Promise<void> {
    const property =
      await this.propertyModel
        .findById(id)
        .exec();

    if (!property) {
      throw new NotFoundException(
        `Property listing with ID "${id}" not found`,
      );
    }

    await this.propertyModel
      .findByIdAndDelete(id)
      .exec();

    await this.activitiesService.log(
      `Deleted property listing: "${property.name}"`,
      ActivityType.PROPERTY,
    );
  }

  async groupDelete(
    dto: GroupDeletePropertiesDto,
  ): Promise<{
    success: boolean;
    count: number;
  }> {
    const { propertyIds } = dto;

    if (
      !propertyIds ||
      propertyIds.length === 0
    ) {
      return {
        success: true,
        count: 0,
      };
    }

    const result =
      await this.propertyModel
        .deleteMany({
          _id: {
            $in: propertyIds,
          },
        })
        .exec();

    await this.activitiesService.log(
      `Bulk deleted ${result.deletedCount} properties from database`,
      ActivityType.PROPERTY,
    );

    return {
      success: true,
      count: result.deletedCount,
    };
  }

  async downloadExcel(
    query: QueryPropertyDto,
  ): Promise<Buffer> {
    const { buffer } =
      await this.generatePropertiesExcel(
        query,
      );

    return buffer;
  }

  async uploadToGoogleDrive(
    query: any,
    inputLimit?: number,
  ): Promise<any> {
    void inputLimit;

    const {
      buffer,
      fileName,
    } =
      await this.generatePropertiesExcel(
        query,
      );

    return this.uploadExcelToGoogleDrive(
      buffer,
      fileName,
    );
  }

  private async generatePropertiesExcel(
    query: any,
  ): Promise<{
    buffer: Buffer;
    fileName: string;
  }> {
    const { properties } =
      await this.findAll({
        ...query,
        limit: query.limit || 99999,
      });

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

    const rows = properties.map(
      (p: any) => {
        const owner =
          p.ownerLandlord || {};

        const ownerName = owner.firstName
          ? `${owner.firstName} ${
              owner.lastName || ''
            }`.trim()
          : typeof p.ownerLandlord ===
              'string'
            ? p.ownerLandlord
            : 'Unknown';

        return [
          p.id ||
            p._id?.toString() ||
            '',

          p.name || '',

          ownerName,

          p.location ||
            p.address ||
            '',

          p.propertyType || '',

          p.category || '',

          p.transaction || '',

          p.price || '',

          p.sqft != null
            ? p.sqft.toString()
            : '',

          p.builder || '',

          p.status || '',

          p.createdAt &&
          !isNaN(
            new Date(
              p.createdAt,
            ).getTime(),
          )
            ? new Date(
                p.createdAt,
              ).toISOString()
            : '',
        ];
      },
    );

    const buffer =
      await generateExcelBuffer(
        'Properties',
        headers,
        rows,
      );

    const fileName = `properties_export_${new Date()
      .toISOString()
      .slice(0, 10)}.xlsx`;

    return {
      buffer,
      fileName,
    };
  }

  private async uploadExcelToGoogleDrive(
    buffer: Buffer,
    fileName: string,
  ): Promise<any> {
    const clientId =
      process.env.GOOGLE_DRIVE_CLIENT_ID;

    const clientSecret =
      process.env.GOOGLE_DRIVE_CLIENT_SECRET;

    const refreshToken =
      process.env.GOOGLE_DRIVE_REFRESH_TOKEN;

    if (
      clientId &&
      clientSecret &&
      refreshToken
    ) {
      try {
        const tokenResponse =
          await fetch(
            'https://oauth2.googleapis.com/token',
            {
              method: 'POST',

              headers: {
                'Content-Type':
                  'application/json',
              },

              body: JSON.stringify({
                client_id: clientId,

                client_secret:
                  clientSecret,

                refresh_token:
                  refreshToken,

                grant_type:
                  'refresh_token',
              }),
            },
          );

        if (!tokenResponse.ok) {
          const errText =
            await tokenResponse.text();

          throw new Error(
            `Google OAuth token refresh failed: ${errText}`,
          );
        }

        const tokenData =
          (await tokenResponse.json()) as any;

        const accessToken =
          tokenData.access_token;

        const boundary =
          'foo_bar_baz';

        const metadata = {
          name: fileName,

          mimeType:
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
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

        const footer =
          `\r\n--${boundary}--\r\n`;

        const multipartBody =
          Buffer.concat([
            Buffer.from(
              header,
              'utf-8',
            ),

            buffer,

            Buffer.from(
              footer,
              'utf-8',
            ),
          ]);

        const uploadResponse =
          await fetch(
            'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
            {
              method: 'POST',

              headers: {
                Authorization:
                  `Bearer ${accessToken}`,

                'Content-Type':
                  `multipart/related; boundary=${boundary}`,

                'Content-Length':
                  multipartBody.length.toString(),
              },

              body: multipartBody,
            },
          );

        if (!uploadResponse.ok) {
          const errText =
            await uploadResponse.text();

          throw new Error(
            `Google Drive upload failed: ${errText}`,
          );
        }

        const fileData =
          (await uploadResponse.json()) as any;

        return {
          success: true,

          message:
            'File successfully uploaded to Google Drive!',

          fileId: fileData.id,
        };
      } catch (err: any) {
        console.error(
          'Google Drive export failed, falling back to local backup:',
          err,
        );
      }
    }

    try {
      const backupsDir =
        path.join(
          process.cwd(),
          'backups',
        );

      if (!fs.existsSync(backupsDir)) {
        fs.mkdirSync(backupsDir, {
          recursive: true,
        });
      }

      const backupFileName =
        `${fileName.replace(
          '.xlsx',
          '',
        )}_drive_${Date.now()}.xlsx`;

      const filePath =
        path.join(
          backupsDir,
          backupFileName,
        );

      fs.writeFileSync(
        filePath,
        buffer,
      );

      const backendUrl =
        process.env.BACKEND_URL ||
        'http://localhost:3000';

      const downloadLink =
        `${backendUrl}/api/databackup/download/${backupFileName}`;

      return {
        success: true,

        message:
          'Google Drive credentials not set in .env. Saved locally in backups folder instead.',

        fileName: backupFileName,

        webViewLink: downloadLink,

        isMock: true,
      };
    } catch (err: any) {
      console.error(
        'Google Drive export simulation failed:',
        err,
      );

      throw new Error(
        `Export to Google Drive failed: ${err.message}`,
      );
    }
  }

  async importProperties(
    properties: any[],
    defaultUserId?: string,
  ): Promise<{
    success: boolean;
    count: number;
  }> {
    const limit = 2000;

    const slice =
      properties.slice(0, limit);

    const createdProperties: any[] = [];

    const defaultUser =
      await this.userModel
        .findOne()
        .exec();

    const fallbackUserId =
      defaultUserId ||
      (
        defaultUser
          ? defaultUser._id.toString()
          : undefined
      );

    const users =
      await this.userModel
        .find()
        .exec();

    const findUserId = (
      assignedVal: any,
    ): string | undefined => {
      if (!assignedVal) {
        return fallbackUserId;
      }

      const valStr =
        assignedVal
          .toString()
          .trim();

      if (!valStr) {
        return fallbackUserId;
      }

      const isValidObjectId =
        /^[0-9a-fA-F]{24}$/.test(
          valStr,
        );

      if (isValidObjectId) {
        return valStr;
      }

      const cleanVal =
        valStr.toLowerCase();

      const foundUser =
        users.find(
          (u) =>
            u.firstName
              .toLowerCase() ===
              cleanVal ||

            u.email
              .toLowerCase() ===
              cleanVal ||

            `${u.firstName} ${
              u.lastName || ''
            }`
              .trim()
              .toLowerCase() ===
              cleanVal,
        );

      return foundUser
        ? foundUser._id.toString()
        : fallbackUserId;
    };

    for (const item of slice) {
      const rawMobile = (
        item.Owner_Mobile ||
        item.Customer_Mobile ||
        item.mobile ||
        item['Customer Mobile'] ||
        item['Owner Mobile'] ||
        ''
      )
        .toString()
        .trim();

      const name = (
        item.Owner_Name ||
        item.Customer_Name ||
        item.name ||
        item['Customer Name'] ||
        item['Owner Name'] ||
        ''
      )
        .toString()
        .trim();

      if (!name || !rawMobile) {
        continue;
      }

      const parsedPhone =
        parseMobileAndCountryCode(
          rawMobile,
        );

      const assignedToId =
        findUserId(
          item.assignedTo ||
            item['Assigned To'],
        );

      let contact =
        await this.contactModel
          .findOne({
            mobile:
              parsedPhone.mobile,

            countryCode:
              parsedPhone.countryCode,

            isDeleted: {
              $ne: true,
            },
          })
          .exec();

      if (!contact) {
        let salutation:
          | string
          | undefined =
          undefined;

        let fName = name;

        let lName:
          | string
          | undefined =
          undefined;

        const nameParts =
          name.split(/\s+/);

        if (nameParts.length > 0) {
          const firstPart =
            nameParts[0].replace(
              /\./g,
              '',
            );

          const salutations = [
            'mr',
            'mrs',
            'ms',
            'dr',
            'prof',
            'sir',
          ];

          if (
            salutations.includes(
              firstPart.toLowerCase(),
            )
          ) {
            salutation =
              nameParts[0];

            nameParts.shift();
          }
        }

        if (nameParts.length > 0) {
          fName =
            nameParts[0];

          nameParts.shift();
        }

        if (nameParts.length > 0) {
          lName =
            nameParts.join(' ');
        }

        contact =
          new this.contactModel({
            salutation,

            firstName: fName,

            lastName: lName,

            countryCode:
              parsedPhone.countryCode,

            mobile:
              parsedPhone.mobile,

            email:
              item.Customer_Email ||
              item.email ||
              item[
                'Customer Email'
              ] ||
              item.Owner_Email ||
              item[
                'Owner Email'
              ] ||
              '',

            companyName:
              item.Customer_Company ||
              item.company ||
              item[
                'Customer Company'
              ] ||
              '',

            customerType:
              'Customer',

            contactType:
              'Employee',

            branch:
              item.Branch ||
              item.branch ||
              'Global Team',

            source:
              item.Source ||
              item.source ||
              'Spreadsheet Import',

            assignedTo:
              assignedToId,
          });

        await contact.save();
      }

      const propertyPayload: any = {
        name:
          item.Property_Name ||
          item.name ||
          item['Property Name'] ||
          item.title ||
          'Unnamed Property',

        location:
          item.Location ||
          item.location ||
          item.address ||
          item.Address ||
          'Unknown Location',

        propertyType:
          item.Property_Type ||
          item.propertyType ||
          item['Property Type'] ||
          'Flat/Apartment',

        category:
          item.Category ||
          item.category ||
          item.Category_Property ||
          item['Category'] ||
          'Residential',

        transaction:
          item.Transaction ||
          item.transaction ||
          'New',

        price:
          item.Price ||
          item.price ||
          '',

        sqft: Number(
          item.Sqft ||
            item.sqft ||
            item['Area (Sq. Ft.)'] ||
            item.area ||
            0,
        ),

        status:
          item.Status ||
          item.status ||
          'Available',

        builder:
          item.Builder ||
          item.builder ||
          '',

        ownerLandlord:
          contact
            ? contact._id.toString()
            : undefined,

        createdBy:
          assignedToId,

        assignedTo:
          assignedToId,

        description:
          item.Description ||
          item.description ||
          '',
      };

      const newProperty =
        new this.propertyModel(
          propertyPayload,
        );

      const savedProperty =
        await newProperty.save();

      createdProperties.push(
        savedProperty,
      );
    }

    await this.activitiesService.log(
      `Bulk imported ${createdProperties.length} properties via Spreadsheet`,
      ActivityType.PROPERTY,
    );

    return {
      success: true,
      count: createdProperties.length,
    };
  }
}

/**
 * Parse a mobile number into country code + mobile number.
 */
function parseMobileAndCountryCode(
  rawMobile: string,
): {
  countryCode: string;
  mobile: string;
} {
  const clean = (rawMobile || '')
    .toString()
    .trim()
    .replace(/[-\s()]/g, '');

  if (clean.startsWith('+')) {
    if (clean.startsWith('+91')) {
      return {
        countryCode: '+91',
        mobile: clean.substring(3),
      };
    }

    if (clean.startsWith('+1')) {
      return {
        countryCode: '+1',
        mobile: clean.substring(2),
      };
    }

    if (clean.startsWith('+44')) {
      return {
        countryCode: '+44',
        mobile: clean.substring(3),
      };
    }

    if (clean.startsWith('+971')) {
      return {
        countryCode: '+971',
        mobile: clean.substring(4),
      };
    }

    const match = clean.match(
      /^(\+\d{1,4})(\d{7,15})$/,
    );

    if (match) {
      return {
        countryCode: match[1],
        mobile: match[2],
      };
    }

    return {
      countryCode: '+91',
      mobile: clean.replace('+', ''),
    };
  }

  if (
    clean.length === 12 &&
    clean.startsWith('91')
  ) {
    return {
      countryCode: '+91',
      mobile: clean.substring(2),
    };
  }

  if (clean.length === 10) {
    return {
      countryCode: '+91',
      mobile: clean,
    };
  }

  return {
    countryCode: '+91',
    mobile: clean,
  };
}
