import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ResponseMessage } from '../../common/decorators/response-message.decorator';

@ApiTags('Users')
@ApiBearerAuth('bearer')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Retrieve all users with their permissions load' })
  @ResponseMessage('Users retrieved successfully')
  async findAll() {
    return this.usersService.findAll();
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Create a new system user' })
  @ResponseMessage('User created successfully')
  async create(
    @Body()
    body: {
      email: string;
      firstName: string;
      lastName?: string;
      role: string;
      password?: string;
      customPermissions?: Record<string, boolean>;
    },
  ) {
    // Set a default password if not provided
    const password = body.password || 'CrmUser123!';
    return this.usersService.create({
      ...body,
      password,
    });
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Modify an existing user details or permissions' })
  @ResponseMessage('User updated successfully')
  async update(
    @Param('id') id: string,
    @Body()
    body: {
      email?: string;
      firstName?: string;
      lastName?: string;
      role?: string;
      password?: string;
      customPermissions?: Record<string, boolean>;
      isActive?: boolean;
    },
  ) {
    return this.usersService.update(id, body);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'De-register a system user' })
  @ResponseMessage('User deleted successfully')
  async delete(@Param('id') id: string) {
    await this.usersService.delete(id);
    return { success: true };
  }

  @Get('agents')
  @ApiOperation({ summary: 'Retrieve all users with AGENT role' })
  @ResponseMessage('Agents retrieved successfully')
  async getAgents() {
    return this.usersService.findAllAgents();
  }
}
