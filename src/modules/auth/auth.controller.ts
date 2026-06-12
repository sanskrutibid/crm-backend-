import { Body, Controller, HttpCode, HttpStatus, Post, Req, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { LogoutDto } from './dto/logout.dto';
import { AuthResponseDataDto } from './dto/auth-response.dto';
import { ResponseMessage } from '../../common/decorators/response-message.decorator';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiCreatedResponse({
    description: 'User created successfully',
    type: AuthResponseDataDto,
  })
  @ResponseMessage('Registration completed successfully')
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Authenticate user and return JWT' })
  @ApiOkResponse({
    description: 'Authentication successful',
    type: AuthResponseDataDto,
  })
  @ResponseMessage('Login completed successfully')
  async login(@Body() loginDto: LoginDto, @Req() req: any) {
    const ip = req.ip || req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '';
    const userAgent = req.headers['user-agent'] || '';
    return this.authService.login(loginDto, { ip, userAgent });
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'Logout user and save logout history' })
  @ResponseMessage('Logout completed successfully')
  async logout(@Body() logoutDto: LogoutDto, @Req() req: any) {
    const userId = req.user.id;
    const ip = req.ip || req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '';
    const userAgent = req.headers['user-agent'] || '';
    return this.authService.logout(userId, logoutDto, { ip, userAgent });
  }
}
