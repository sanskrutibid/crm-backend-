import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { UserDocument } from '../users/schemas/user.schema';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { LogoutDto } from './dto/logout.dto';
import { LoginHistoryService } from '../login-history/login-history.service';
import { EmployeesService } from '../employees/employees.service';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private configService: ConfigService,
    private loginHistoryService: LoginHistoryService,
    private employeesService: EmployeesService,
  ) {}

  async checkEmployee(email: string, name: string) {
    if (!email || !name) {
      throw new BadRequestException('Email and Name are required');
    }
    const employee = await this.employeesService.findOneByEmail(email);
    if (!employee) {
      return { exists: false, message: 'No employee found with this email' };
    }
    const enteredName = name.trim().toLowerCase();
    const employeeName = `${employee.firstName} ${employee.lastName}`.trim().toLowerCase();
    if (enteredName !== employeeName) {
      return { exists: false, message: 'Name does not match the employee record' };
    }
    return { exists: true, message: 'Employee verified' };
  }

  async register(registerDto: RegisterDto) {
    if (registerDto.password !== registerDto.confirmPassword) {
      throw new BadRequestException('Passwords do not match');
    }
    if (registerDto.agreeTerms !== true) {
      throw new BadRequestException('You must accept the terms and conditions');
    }

    const email = registerDto.email.toLowerCase().trim();

    // Check if user already exists
    const existingUser = await this.usersService.findByEmail(email);
    let employee = await this.employeesService.findOneByEmail(email);

    if (existingUser && !employee) {
      throw new BadRequestException('User with this email is already registered');
    }

    const nameParts = registerDto.name.trim().split(/\s+/);
    const firstName = nameParts[0] || 'Unknown';
    const lastName = nameParts.slice(1).join(' ') || '';

    if (employee) {
      // If employee exists, update their password
      employee.password = registerDto.password;
      await employee.save();
    } else {
      // If employee does not exist, create a new employee record so they show up in the employee table!
      const baseId = this.employeesService.generateCombinationEmployeeId(
        firstName,
        lastName,
        'Sales Agent', // Default designation
        '1990-01-01', // Default DOB
        new Date().toISOString().split('T')[0], // Default joiningDate
        new Date(),
      );
      const employeeId = await this.employeesService.generateUniqueCombinationId(baseId);

      employee = await this.employeesService.create({
        employeeId,
        firstName,
        lastName,
        personalEmail: email,
        gender: 'Male', // Default gender
        dob: '1990-01-01', // Default DOB
        mobile: '0000000000', // Default placeholder mobile
        department: 'Sales', // Default department
        designation: 'Sales Agent', // Default designation
        joiningDate: new Date().toISOString().split('T')[0],
        employmentType: 'Permanent',
        password: registerDto.password,
        confirmPassword: registerDto.confirmPassword,
      });
    }

    let user = await this.usersService.findByEmail(email);
    if (!user) {
      user = await this.usersService.create({
        email: email,
        firstName,
        lastName,
        role: registerDto.role || 'Agent/Broker',
        password: registerDto.password,
      });
    } else {
      // Update name and password if user record already exists (auto-created by admin)
      await this.usersService.update(user._id.toString(), {
        firstName,
        lastName,
        password: registerDto.password,
      });
      user = await this.usersService.findById(user._id.toString());
    }

    if (!user) {
      throw new BadRequestException('User record could not be retrieved or created');
    }

    const token = this.generateToken(user);
    return {
      user: {
        id: user._id.toString(),
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
      accessToken: token,
    };
  }

  async login(
    loginDto: LoginDto,
    clientInfo: { ip: string; userAgent: string },
  ) {
    const cleanEmail = loginDto.email.toLowerCase().trim();
    const employee = await this.employeesService.findOneByEmail(cleanEmail);
    
    let isPasswordValid = false;
    let user: UserDocument | null = null;

    if (employee) {
      // Employees authenticate using their password stored in the Employee record (plain text)
      isPasswordValid = employee.password === loginDto.password;
      if (isPasswordValid) {
        // Retrieve the corresponding User using either their official or personal email
        if (employee.officialEmail) {
          user = await this.usersService.findByEmail(employee.officialEmail);
        }
        if (!user && employee.personalEmail) {
          user = await this.usersService.findByEmail(employee.personalEmail);
        }
      }
    } else {
      // Fallback: check User collection for non-employee user records (e.g. Admin/Super Admin)
      user = await this.usersService.findByEmail(cleanEmail);
      if (user && user.password) {
        isPasswordValid = await bcrypt.compare(loginDto.password, user.password);
      }
    }

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!user) {
      throw new UnauthorizedException('User account has not been registered');
    }

    const token = this.generateToken(user);

    // Save login history log
    await this.loginHistoryService.create({
      userId: user._id.toString(),
      type: 'login',
      ip: clientInfo.ip,
      userAgent: clientInfo.userAgent,
      lat: loginDto.lat,
      long: loginDto.long,
    });

    return {
      user: {
        id: user._id.toString(),
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
      accessToken: token,
    };
  }

  async logout(
    userId: string,
    logoutDto: LogoutDto,
    clientInfo: { ip: string; userAgent: string },
  ) {
    // Save logout history log
    await this.loginHistoryService.create({
      userId,
      type: 'logout',
      ip: clientInfo.ip,
      userAgent: clientInfo.userAgent,
      lat: logoutDto.lat,
      long: logoutDto.long,
    });

    return {
      success: true,
    };
  }

  private generateToken(user: any): string {
    const secret =
      this.configService.get<string>('JWT_SECRET') || 'your_secret_key';
    const payload = {
      sub: user.id ?? user._id.toString(),
      email: user.email,
      role: user.role,
    };
    return jwt.sign(payload, secret, { expiresIn: '1d' });
  }
}
