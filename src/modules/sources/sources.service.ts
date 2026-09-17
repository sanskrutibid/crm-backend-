import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  OnModuleInit,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, isValidObjectId } from 'mongoose';
import { Source, SourceDocument } from './schemas/source.schema';
import { CreateSourceDto } from './dto/create-source.dto';
import { UpdateSourceDto } from './dto/update-source.dto';

@Injectable()
export class SourcesService implements OnModuleInit {
  private readonly logger = new Logger(SourcesService.name);

  constructor(
    @InjectModel(Source.name) private readonly sourceModel: Model<SourceDocument>,
  ) {}

  async onModuleInit() {
    await this.autoAssignMissingSourceIds();
  }

  /**
   * Automatically backfill sequential sourceId (1, 2, 3...) for any existing records that lack it.
   */
  async autoAssignMissingSourceIds(): Promise<void> {
    try {
      const allSources = await this.sourceModel
        .find()
        .sort({ createdAt: 1, _id: 1 })
        .exec();

      if (allSources.length > 0) {
        let maxExisting = 0;
        for (const s of allSources) {
          if (typeof s.sourceId === 'number' && !isNaN(s.sourceId)) {
            if (s.sourceId > maxExisting) maxExisting = s.sourceId;
          }
        }

        let assignedCount = 0;
        for (const s of allSources) {
          if (typeof s.sourceId !== 'number' || isNaN(s.sourceId) || s.sourceId <= 0) {
            maxExisting++;
            s.sourceId = maxExisting;
            assignedCount++;
            try {
              await s.save();
            } catch (e) {
              await this.sourceModel
                .findByIdAndUpdate(s._id, { sourceId: maxExisting })
                .exec();
            }
          }
        }

        if (assignedCount > 0) {
          this.logger.log(
            `Assigned sequential sourceIds to ${assignedCount} existing sources (Max: ${maxExisting})`,
          );
        }
      }
    } catch (error) {
      this.logger.error('Error auto-assigning missing sourceIds:', error);
    }
  }

  /**
   * Computes next auto-incrementing integer sourceId (1, 2, 3...)
   * Guarantees that the candidate ID is strictly unique in the collection.
   */
  async getNextSourceId(): Promise<number> {
    try {
      const maxSource = await this.sourceModel
        .findOne({ sourceId: { $exists: true, $ne: null } })
        .sort({ sourceId: -1 })
        .select('sourceId')
        .lean()
        .exec();

      let candidate = 1;
      if (
        maxSource &&
        typeof (maxSource as any).sourceId === 'number' &&
        !isNaN((maxSource as any).sourceId) &&
        (maxSource as any).sourceId > 0
      ) {
        candidate = (maxSource as any).sourceId + 1;
      } else {
        const count = await this.sourceModel.countDocuments().exec();
        candidate = count + 1;
      }

      // Guarantee candidate is not taken by any existing document
      while (await this.sourceModel.exists({ sourceId: candidate })) {
        candidate++;
      }
      return candidate;
    } catch (e) {
      this.logger.warn('Failed to query max sourceId, counting documents instead', e);
      const total = await this.sourceModel.countDocuments().exec();
      return total + 1;
    }
  }

  /**
   * Create a new source. The user only needs to enter the source name.
   * sourceId is automatically generated and incremented (1, 2, 3...).
   */
  async create(createSourceDto: any): Promise<SourceDocument> {
    let rawName = '';
    if (typeof createSourceDto === 'string') {
      rawName = createSourceDto;
    } else if (createSourceDto && typeof createSourceDto === 'object') {
      rawName =
        createSourceDto.name ||
        createSourceDto.sourceName ||
        createSourceDto.source ||
        createSourceDto.source_name ||
        createSourceDto.sourcename ||
        createSourceDto.title ||
        createSourceDto.label ||
        createSourceDto.value ||
        createSourceDto.SourceName ||
        createSourceDto.Source ||
        createSourceDto.Name ||
        '';
    }

    if (!rawName || typeof rawName !== 'string' || !rawName.trim()) {
      throw new BadRequestException('Source name is required');
    }

    const name = rawName.trim();

    // Check for duplicate name (case-insensitive)
    const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const existing = await this.sourceModel
      .findOne({
        name: { $regex: new RegExp(`^${escapedName}$`, 'i') },
      })
      .exec();

    if (existing) {
      if (typeof existing.sourceId !== 'number' || isNaN(existing.sourceId) || existing.sourceId <= 0) {
        existing.sourceId = await this.getNextSourceId();
        await existing.save();
      }
      return existing;
    }

    let sourceId = await this.getNextSourceId();
    const isActive =
      createSourceDto?.isActive !== undefined ? createSourceDto.isActive : true;

    try {
      const createdSource = new this.sourceModel({
        name,
        sourceId,
        isActive,
      });
      return await createdSource.save();
    } catch (err: any) {
      // If MongoDB duplicate key error occurs
      if (err && (err.code === 11000 || err.name === 'MongoServerError')) {
        // If duplicate sourceId, recalculate and retry
        if (err.keyPattern?.sourceId || err.message?.includes('sourceId')) {
          sourceId = await this.getNextSourceId();
          const retrySource = new this.sourceModel({
            name,
            sourceId,
            isActive,
          });
          return await retrySource.save();
        }
        // If duplicate name, find and return existing
        const existingByName = await this.sourceModel
          .findOne({
            name: { $regex: new RegExp(`^${escapedName}$`, 'i') },
          })
          .exec();
        if (existingByName) return existingByName;
      }
      throw err;
    }
  }


  /**
   * Retrieve all sources sorted by sourceId ascending (1, 2, 3...).
   */
  async findAll(): Promise<SourceDocument[]> {
    let sources = await this.sourceModel
      .find()
      .sort({ sourceId: 1, createdAt: 1 })
      .exec();

    // Ensure all records in response definitely have a valid sourceId
    let maxId = 0;
    for (const s of sources) {
      if (typeof s.sourceId === 'number' && !isNaN(s.sourceId)) {
        if (s.sourceId > maxId) maxId = s.sourceId;
      }
    }

    let needsRefetch = false;
    for (let i = 0; i < sources.length; i++) {
      if (typeof sources[i].sourceId !== 'number' || isNaN(sources[i].sourceId)) {
        maxId++;
        sources[i].sourceId = maxId;
        needsRefetch = true;
        try {
          await sources[i].save();
        } catch (e) {
          await this.sourceModel
            .findByIdAndUpdate(sources[i]._id, { sourceId: maxId })
            .exec();
        }
      }
    }

    if (needsRefetch) {
      sources = await this.sourceModel
        .find()
        .sort({ sourceId: 1, createdAt: 1 })
        .exec();
    }

    return sources;
  }

  /**
   * Retrieve single source by MongoDB ObjectId, numeric sourceId, or exact name.
   */
  async findOne(idOrSourceId: string): Promise<SourceDocument> {
    let source: SourceDocument | null = null;

    // Check numeric sourceId (e.g. "1", "2", "3")
    if (!isNaN(Number(idOrSourceId)) && /^\d+$/.test(idOrSourceId.trim())) {
      source = await this.sourceModel
        .findOne({ sourceId: Number(idOrSourceId) })
        .exec();
    }

    // Check valid MongoDB ObjectId
    if (!source && isValidObjectId(idOrSourceId)) {
      source = await this.sourceModel.findById(idOrSourceId).exec();
    }

    // Fallback: Check by exact name
    if (!source) {
      source = await this.sourceModel
        .findOne({ name: idOrSourceId.trim() })
        .exec();
    }

    if (!source) {
      throw new NotFoundException(`Source with identifier "${idOrSourceId}" not found`);
    }

    return source;
  }

  /**
   * Update source details (e.g. rename source).
   */
  async update(
    idOrSourceId: string,
    updateSourceDto: UpdateSourceDto,
  ): Promise<SourceDocument> {
    const source = await this.findOne(idOrSourceId);

    const rawName =
      updateSourceDto.name ||
      updateSourceDto.sourceName ||
      updateSourceDto.source ||
      (updateSourceDto as any).source_name;

    if (rawName && typeof rawName === 'string' && rawName.trim()) {
      const newName = rawName.trim();

      // Check if new name already exists on another record
      const escapedName = newName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const duplicate = await this.sourceModel
        .findOne({
          name: { $regex: new RegExp(`^${escapedName}$`, 'i') },
          _id: { $ne: source._id },
        })
        .exec();

      if (duplicate) {
        throw new ConflictException(`Source with name "${newName}" already exists`);
      }

      source.name = newName;
    }

    if (updateSourceDto.isActive !== undefined) {
      source.isActive = updateSourceDto.isActive;
    }

    return source.save();
  }

  /**
   * Remove a source by MongoDB ObjectId or numeric sourceId.
   */
  async remove(idOrSourceId: string): Promise<void> {
    const source = await this.findOne(idOrSourceId);
    await this.sourceModel.findByIdAndDelete(source._id).exec();
  }
}


