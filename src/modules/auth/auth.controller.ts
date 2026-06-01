import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiCreatedResponse,
  ApiOkResponse,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { AuthResponseDataDto } from './dto/auth-response.dto';
import { ResponseMessage } from '../../common/decorators/response-message.decorator';

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
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }
}
