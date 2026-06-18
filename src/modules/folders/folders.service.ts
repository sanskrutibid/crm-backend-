import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Folder, FolderDocument } from './schemas/folder.schema';
import { CreateFolderDto } from './dto/create-folder.dto';
import { UpdateFolderDto } from './dto/update-folder.dto';

@Injectable()
export class FoldersService {
  constructor(
    @InjectModel(Folder.name) private readonly folderModel: Model<FolderDocument>,
  ) {}

  async create(createFolderDto: CreateFolderDto): Promise<FolderDocument> {
    const createdFolder = new this.folderModel(createFolderDto);
    return createdFolder.save();
  }

  async findAll(): Promise<FolderDocument[]> {
    return this.folderModel.find().exec();
  }

  async findOne(id: string): Promise<FolderDocument> {
    const folder = await this.folderModel.findById(id).exec();
    if (!folder) {
      throw new NotFoundException(`Folder with ID ${id} not found`);
    }
    return folder;
  }

  async update(id: string, updateFolderDto: UpdateFolderDto): Promise<FolderDocument> {
    const updatedFolder = await this.folderModel.findByIdAndUpdate(
      id,
      updateFolderDto,
      { new: true },
    ).exec();
    if (!updatedFolder) {
      throw new NotFoundException(`Folder with ID ${id} not found`);
    }
    return updatedFolder;
  }

  async remove(id: string): Promise<void> {
    const result = await this.folderModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(`Folder with ID ${id} not found`);
    }
  }
}
