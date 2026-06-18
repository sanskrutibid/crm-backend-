import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Source, SourceDocument } from './schemas/source.schema';
import { CreateSourceDto } from './dto/create-source.dto';
import { UpdateSourceDto } from './dto/update-source.dto';

@Injectable()
export class SourcesService {
  constructor(
    @InjectModel(Source.name) private readonly sourceModel: Model<SourceDocument>,
  ) {}

  async create(createSourceDto: CreateSourceDto): Promise<SourceDocument> {
    const createdSource = new this.sourceModel(createSourceDto);
    return createdSource.save();
  }

  async findAll(): Promise<SourceDocument[]> {
    return this.sourceModel.find().exec();
  }

  async findOne(id: string): Promise<SourceDocument> {
    const source = await this.sourceModel.findById(id).exec();
    if (!source) {
      throw new NotFoundException(`Source with ID ${id} not found`);
    }
    return source;
  }

  async update(id: string, updateSourceDto: UpdateSourceDto): Promise<SourceDocument> {
    const updatedSource = await this.sourceModel.findByIdAndUpdate(
      id,
      updateSourceDto,
      { new: true },
    ).exec();
    if (!updatedSource) {
      throw new NotFoundException(`Source with ID ${id} not found`);
    }
    return updatedSource;
  }

  async remove(id: string): Promise<void> {
    const result = await this.sourceModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(`Source with ID ${id} not found`);
    }
  }
}
