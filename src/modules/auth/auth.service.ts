import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { LogoutDto } from './dto/logout.dto';
import { LoginHistoryService } from '../login-history/login-history.service';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private configService: ConfigService,
    private loginHistoryService: LoginHistoryService,
  ) {}

  async register(registerDto: RegisterDto) {
    if (registerDto.password !== registerDto.confirmPassword) {
      throw new BadRequestException('Passwords do not match');
    }
    if (registerDto.agreeTerms !== true) {
      throw new BadRequestException('You must accept the terms and conditions');
    }

    const nameParts = registerDto.name.trim().split(/\s+/);
    const firstName = nameParts[0] || 'Unknown';
    const lastName = nameParts.slice(1).join(' ') || '';

    const user = await this.usersService.create({
      email: registerDto.email,
      password: registerDto.password,
      firstName,
      lastName,
      role: registerDto.role,
    });
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
    const user = await this.usersService.findByEmail(loginDto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.password ?? '',
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
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
