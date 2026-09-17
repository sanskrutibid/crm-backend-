import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Employee, EmployeeDocument } from './schemas/employee.schema';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { UsersService } from '../users/users.service';

@Injectable()
export class EmployeesService {
  constructor(
    @InjectModel(Employee.name) private readonly employeeModel: Model<EmployeeDocument>,
    private readonly usersService: UsersService,
  ) {}

  generateCombinationEmployeeId(
    firstName: string,
    lastName: string,
    designation: string,
    dob: Date | string,
    joiningDate: Date | string,
    creationDate: Date = new Date(),
  ): string {
    const fn = (firstName || '').trim().toUpperCase();
    const ln = (lastName || '').trim().toUpperCase();
    const des = (designation || '').trim().toUpperCase();

    const fChar = fn ? fn.charAt(0) : 'X';
    const lChar = ln ? ln.charAt(0) : 'X';
    const dChar = des ? des.charAt(0) : 'X';

    let dobDay = '00';
    if (dob) {
      const d = new Date(dob);
      if (!isNaN(d.getTime())) {
        dobDay = String(d.getDate()).padStart(2, '0');
      }
    }

    let jdYearDigit = '0';
    if (joiningDate) {
      const d = new Date(joiningDate);
      if (!isNaN(d.getTime())) {
        jdYearDigit = String(d.getFullYear()).slice(-1);
      }
    }

    const docDay = String(creationDate.getDate()).padStart(2, '0');

    return `${fChar}${lChar}${dChar}${dobDay}${jdYearDigit}${docDay}`;
  }

  async generateUniqueCombinationId(baseId: string): Promise<string> {
    let uniqueId = baseId;
    let counter = 1;
    while (await this.employeeModel.findOne({ employeeId: uniqueId }).exec()) {
      const suffix = String(counter);
      uniqueId = baseId.substring(0, 8 - suffix.length) + suffix;
      counter++;
      if (counter > 99) {
        break;
      }
    }
    return uniqueId;
  }

  async generateNextEmployeeId(queryParams?: {
    firstName?: string;
    lastName?: string;
    designation?: string;
    dob?: string;
    joiningDate?: string;
  }): Promise<string> {
    if (queryParams && queryParams.firstName && queryParams.lastName) {
      const baseId = this.generateCombinationEmployeeId(
        queryParams.firstName,
        queryParams.lastName,
        queryParams.designation || '',
        queryParams.dob || '',
        queryParams.joiningDate || '',
        new Date(),
      );
      return this.generateUniqueCombinationId(baseId);
    }

    const lastEmployee = await this.employeeModel
      .findOne({}, { employeeId: 1 })
      .sort({ employeeId: -1 })
      .exec();

    if (!lastEmployee || !lastEmployee.employeeId) {
      return 'EMP001';
    }

    const match = lastEmployee.employeeId.match(/^EMP(\d+)$/);
    if (!match) {
      // If employeeId is not in the format EMPXXX, fall back to checking if there is a number
      const numMatch = lastEmployee.employeeId.match(/\d+/);
      const nextNum = numMatch ? parseInt(numMatch[0], 10) + 1 : 1;
      return `EMP${String(nextNum).padStart(3, '0')}`;
    }

    const nextIdNumber = parseInt(match[1], 10) + 1;
    return `EMP${String(nextIdNumber).padStart(3, '0')}`;
  }

  async create(createEmployeeDto: CreateEmployeeDto): Promise<EmployeeDocument> {
    if (createEmployeeDto.password && createEmployeeDto.confirmPassword && createEmployeeDto.password !== createEmployeeDto.confirmPassword) {
      throw new BadRequestException('Passwords do not match');
    }

    const personalEmailClean = createEmployeeDto.personalEmail.toLowerCase().trim();
    const officialEmailClean = createEmployeeDto.officialEmail?.toLowerCase().trim() || '';

    // Check if personal email is already used by an employee
    const existingByPersonalEmail = await this.employeeModel
      .findOne({ personalEmail: personalEmailClean })
      .exec();
    if (existingByPersonalEmail) {
      throw new ConflictException('Employee with this personal email already exists');
    }

    // Check if official email is already used by an employee
    if (officialEmailClean) {
      const existingByOfficialEmail = await this.employeeModel
        .findOne({ officialEmail: officialEmailClean })
        .exec();
      if (existingByOfficialEmail) {
        throw new ConflictException('Employee with this official email already exists');
      }
    }

    // Auto-generate employeeId if not provided or format is invalid
    let employeeId = createEmployeeDto.employeeId?.trim();
    if (!employeeId) {
      const baseId = this.generateCombinationEmployeeId(
        createEmployeeDto.firstName,
        createEmployeeDto.lastName,
        createEmployeeDto.designation,
        createEmployeeDto.dob,
        createEmployeeDto.joiningDate,
        new Date(),
      );
      employeeId = await this.generateUniqueCombinationId(baseId);
    } else {
      // Check if manually provided employeeId already exists
      const existingById = await this.employeeModel.findOne({ employeeId }).exec();
      if (existingById) {
        employeeId = await this.generateUniqueCombinationId(employeeId);
      }
    }

    const newEmployee = new this.employeeModel({
      ...createEmployeeDto,
      employeeId,
      personalEmail: personalEmailClean,
      officialEmail: officialEmailClean,
      dob: new Date(createEmployeeDto.dob),
      joiningDate: new Date(createEmployeeDto.joiningDate),
    });

    const saved = await newEmployee.save();

    // Auto-create corresponding User record using officialEmail (fallback to personalEmail)
    try {
      const emailToUse = officialEmailClean || personalEmailClean;
      if (emailToUse) {
        const existingUser = await this.usersService.findByEmail(emailToUse);
        if (!existingUser) {
          let userRole = 'Agent/Broker';
          const des = (saved.designation || '').trim().toLowerCase();
          if (des.includes('super admin') || des.includes('supper admin') || des.includes('superadmin')) {
            userRole = 'Super Admin';
          } else if (des.includes('admin')) {
            userRole = 'Super Admin';
          } else if (des.includes('editor')) {
            userRole = 'Editor';
          } else if (des.includes('client') || des.includes('buyer')) {
            userRole = 'Client/Buyer';
          }

          await this.usersService.create({
            email: emailToUse,
            firstName: saved.firstName,
            lastName: saved.lastName || '',
            role: userRole,
            password: createEmployeeDto.password || 'CrmUser123!',
            isActive: saved.status === 'Active',
          });
        }
      }
    } catch (err) {
      console.error('Failed to auto-create user for employee:', err);
    }

    return saved;
  }

  async findAll(): Promise<EmployeeDocument[]> {
    return this.employeeModel.find().sort({ createdAt: -1 }).exec();
  }

  async findOne(id: string): Promise<EmployeeDocument> {
    // Search by MongoDB ObjectId or employeeId
    let employee: EmployeeDocument | null = null;
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      employee = await this.employeeModel.findById(id).exec();
    }
    if (!employee) {
      employee = await this.employeeModel.findOne({ employeeId: id }).exec();
    }

    if (!employee) {
      throw new NotFoundException(`Employee with identifier ${id} not found`);
    }
    return employee;
  }

  async update(id: string, updateEmployeeDto: UpdateEmployeeDto): Promise<EmployeeDocument> {
    const employee = await this.findOne(id);
    const oldPersonalEmail = employee.personalEmail;
    const oldOfficialEmail = employee.officialEmail;

    if (updateEmployeeDto.personalEmail) {
      const emailLower = updateEmployeeDto.personalEmail.toLowerCase().trim();
      if (emailLower !== employee.personalEmail) {
        const existingByEmail = await this.employeeModel.findOne({ personalEmail: emailLower }).exec();
        if (existingByEmail) {
          throw new ConflictException('Employee with this personal email already exists');
        }
        employee.personalEmail = emailLower;
      }
    }

    if (updateEmployeeDto.officialEmail) {
      const officialLower = updateEmployeeDto.officialEmail.toLowerCase().trim();
      if (officialLower !== employee.officialEmail) {
        const existingByOfficial = await this.employeeModel.findOne({ officialEmail: officialLower }).exec();
        if (existingByOfficial) {
          throw new ConflictException('Employee with this official email already exists');
        }
        employee.officialEmail = officialLower;
      }
    } else if (updateEmployeeDto.officialEmail === '') {
      employee.officialEmail = '';
    }

    if (updateEmployeeDto.employeeId && updateEmployeeDto.employeeId !== employee.employeeId) {
      const existingById = await this.employeeModel.findOne({ employeeId: updateEmployeeDto.employeeId }).exec();
      if (existingById) {
        throw new ConflictException(`Employee with ID ${updateEmployeeDto.employeeId} already exists`);
      }
      employee.employeeId = updateEmployeeDto.employeeId;
    }

    // Update remaining properties
    const { personalEmail, officialEmail, employeeId, dob, joiningDate, ...rest } = updateEmployeeDto;
    
    // Assign fields
    Object.assign(employee, rest);

    if (dob) {
      employee.dob = new Date(dob);
    }
    if (joiningDate) {
      employee.joiningDate = new Date(joiningDate);
    }

    const saved = await employee.save();

    // Sync to User collection
    try {
      const oldEmailToUse = (oldOfficialEmail || oldPersonalEmail || '').toLowerCase().trim();
      const newEmailToUse = (saved.officialEmail || saved.personalEmail || '').toLowerCase().trim();
      if (oldEmailToUse && newEmailToUse) {
        const existingUser = await this.usersService.findByEmail(oldEmailToUse);
        let userRole = 'Agent/Broker';
        const des = (updateEmployeeDto.designation || saved.designation || '').trim().toLowerCase();
        if (des) {
          if (des.includes('super admin') || des.includes('supper admin') || des.includes('superadmin')) {
            userRole = 'Super Admin';
          } else if (des.includes('admin')) {
            userRole = 'Super Admin';
          } else if (des.includes('editor')) {
            userRole = 'Editor';
          } else if (des.includes('client') || des.includes('buyer')) {
            userRole = 'Client/Buyer';
          }
        }
        if (existingUser) {
          await this.usersService.update(existingUser._id.toString(), {
            email: newEmailToUse,
            firstName: saved.firstName,
            lastName: saved.lastName || '',
            role: userRole,
            isActive: saved.status === 'Active',
            ...(updateEmployeeDto.password ? { password: updateEmployeeDto.password } : {}),
          });
        } else {
          // If User doesn't exist, create it
          await this.usersService.create({
            email: newEmailToUse,
            firstName: saved.firstName,
            lastName: saved.lastName || '',
            role: userRole,
            isActive: saved.status === 'Active',
            password: updateEmployeeDto.password || 'CrmUser123!',
          });
        }
      }
    } catch (err) {
      console.error('Failed to sync user details for employee update:', err);
    }

    return saved;
  }

  async remove(id: string): Promise<{ deleted: boolean }> {
    const employee = await this.findOne(id);
    await this.employeeModel.findByIdAndDelete(employee._id).exec();

    // Sync deletion to User collection
    try {
      const emailToUse = (employee.officialEmail || employee.personalEmail || '').toLowerCase().trim();
      if (emailToUse) {
        const existingUser = await this.usersService.findByEmail(emailToUse);
        if (existingUser) {
          await this.usersService.delete(existingUser._id.toString());
        }
      }
    } catch (err) {
      console.error('Failed to delete user for employee:', err);
    }

    return { deleted: true };
  }

  async findOneByEmail(email: string): Promise<EmployeeDocument | null> {
    const cleanEmail = email.toLowerCase().trim();
    return this.employeeModel
      .findOne({
        $or: [
          { personalEmail: cleanEmail },
          { officialEmail: cleanEmail }
        ]
      })
      .exec();
  }

  async updateStatus(id: string, status: string): Promise<EmployeeDocument> {
    const cleanStatus = status.trim();
    if (cleanStatus !== 'Active' && cleanStatus !== 'Inactive') {
      throw new BadRequestException('Status must be either Active or Inactive');
    }
    return this.update(id, { status: cleanStatus });
  }
}
