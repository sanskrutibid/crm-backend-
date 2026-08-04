import { Injectable, ConflictException, Inject, forwardRef } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';
import { Employee, EmployeeDocument } from '../employees/schemas/employee.schema';
import { RolesService } from '../roles/roles.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Employee.name) private employeeModel: Model<EmployeeDocument>,
    private readonly rolesService: RolesService,
  ) {}

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email }).exec();
  }

  async findById(id: string): Promise<UserDocument | null> {
    return this.userModel.findById(id).exec();
  }

  async create(userData: any): Promise<UserDocument> {
    const existingUser = await this.findByEmail(userData.email!);
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }
    const newUser = new this.userModel({
      ...userData,
      customPermissions: userData.customPermissions
        ? new Map(Object.entries(userData.customPermissions))
        : new Map(),
    });
    return newUser.save();
  }

  async findAll(): Promise<any[]> {
    const users = await this.userModel.find().exec();
    const results: any[] = [];
    for (const user of users) {
      const userObj = user.toJSON();
      const effectivePermissions = await this.getEffectivePermissionsForUser(user);
      results.push({
        ...userObj,
        effectivePermissions,
      });
    }
    return results;
  }

  async update(id: string, updateData: any): Promise<any | null> {
    const user = await this.userModel.findById(id).exec();
    if (!user) return null;

    if (updateData.email) user.email = updateData.email;
    if (updateData.firstName) user.firstName = updateData.firstName;
    if (updateData.lastName !== undefined) user.lastName = updateData.lastName;
    if (updateData.role) user.role = updateData.role;
    if (updateData.isActive !== undefined) user.isActive = updateData.isActive;

    if (updateData.password) {
      user.password = updateData.password;
    }

    if (updateData.customPermissions) {
      user.customPermissions = new Map(Object.entries(updateData.customPermissions));
    }

    const saved = await user.save();
    const userObj = saved.toJSON();
    const effectivePermissions = await this.getEffectivePermissionsForUser(saved);
    return {
      ...userObj,
      effectivePermissions,
    };
  }

  async delete(id: string): Promise<void> {
    await this.userModel.findByIdAndDelete(id).exec();
  }

  async findAllAgents(): Promise<UserDocument[]> {
    const employees = await this.employeeModel.find({}, { personalEmail: 1 }).exec();
    const emails = employees.map(emp => emp.personalEmail.toLowerCase().trim());
    return this.userModel
      .find({
        email: { $in: emails },
        isActive: true,
      })
      .exec();
  }

  async getEffectivePermissionsForUser(user: UserDocument): Promise<Record<string, boolean>> {
    const roleDoc = await this.rolesService.findByName(user.role);
    const rolePermissions = roleDoc
      ? Object.fromEntries(roleDoc.permissions)
      : {};
    const customPermissions = user.customPermissions
      ? Object.fromEntries(user.customPermissions)
      : {};
    return { ...rolePermissions, ...customPermissions };
  }
}
