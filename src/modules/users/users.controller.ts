import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ResponseMessage } from '../../common/decorators/response-message.decorator';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('agents')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Retrieve all users with AGENT role' })
  @ResponseMessage('Agents retrieved successfully')
  async getAgents() {
    return this.usersService.findAllAgents();
  }
}
