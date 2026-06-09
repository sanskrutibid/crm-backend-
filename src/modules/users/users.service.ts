import { Injectable, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument, UserRole } from './schemas/user.schema';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email }).exec();
  }

  async findById(id: string): Promise<UserDocument | null> {
    return this.userModel.findById(id).exec();
  }

  async create(userData: Partial<User>): Promise<UserDocument> {
    const existingUser = await this.findByEmail(userData.email!);
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }
    const newUser = new this.userModel(userData);
    return newUser.save();
  }

  async findAllAgents(): Promise<UserDocument[]> {
    return this.userModel.find({ role: UserRole.AGENT, isActive: true }).exec();
  }
}
