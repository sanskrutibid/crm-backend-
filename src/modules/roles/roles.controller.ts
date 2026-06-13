import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { RolesService } from './roles.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ResponseMessage } from '../../common/decorators/response-message.decorator';

@ApiTags('Roles')
@ApiBearerAuth('bearer')
@Controller('roles')
@UseGuards(JwtAuthGuard)
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  @ApiOperation({ summary: 'Retrieve all roles and their permissions matrix' })
  @ResponseMessage('Roles retrieved successfully')
  async findAll() {
    return this.rolesService.findAll();
  }

  @Post()
  @ApiOperation({ summary: 'Create or update a roles permissions map' })
  @ResponseMessage('Role configuration saved successfully')
  async createOrUpdate(
    @Body()
    body: {
      name: string;
      permissions: Record<string, boolean>;
    },
  ) {
    return this.rolesService.createOrUpdate(body);
  }

  @Delete(':name')
  @ApiOperation({ summary: 'Delete a customized user role' })
  @ResponseMessage('Role deleted successfully')
  async delete(@Param('name') name: string) {
    await this.rolesService.delete(name);
    return { success: true };
  }
}
