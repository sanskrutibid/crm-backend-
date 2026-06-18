import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Branch, BranchDocument } from './schemas/branch.schema';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';

@Injectable()
export class BranchesService {
  constructor(
    @InjectModel(Branch.name) private readonly branchModel: Model<BranchDocument>,
  ) {}

  async create(createBranchDto: CreateBranchDto): Promise<BranchDocument> {
    const createdBranch = new this.branchModel({
      ...createBranchDto,
      assigneeTo: createBranchDto.assigneeTo ? createBranchDto.assigneeTo : null,
      assignees: createBranchDto.assignees || [],
    });
    const saved = await createdBranch.save();
    return saved.populate([
      { path: 'assigneeTo', select: 'firstName lastName email role' },
      { path: 'assignees', select: 'firstName lastName email role' }
    ]);
  }

  async findAll(): Promise<BranchDocument[]> {
    return this.branchModel
      .find()
      .populate('assigneeTo', 'firstName lastName email role')
      .populate('assignees', 'firstName lastName email role')
      .exec();
  }

  async findOne(id: string): Promise<BranchDocument> {
    const branch = await this.branchModel
      .findById(id)
      .populate('assigneeTo', 'firstName lastName email role')
      .populate('assignees', 'firstName lastName email role')
      .exec();
    if (!branch) {
      throw new NotFoundException(`Branch with ID ${id} not found`);
    }
    return branch;
  }

  async update(id: string, updateBranchDto: UpdateBranchDto): Promise<BranchDocument> {
    const updatedBranch = await this.branchModel
      .findByIdAndUpdate(id, updateBranchDto, { new: true })
      .populate('assigneeTo', 'firstName lastName email role')
      .populate('assignees', 'firstName lastName email role')
      .exec();
    if (!updatedBranch) {
      throw new NotFoundException(`Branch with ID ${id} not found`);
    }
    return updatedBranch;
  }

  async remove(id: string): Promise<void> {
    const result = await this.branchModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(`Branch with ID ${id} not found`);
    }
  }
}
