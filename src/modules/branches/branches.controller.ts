import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { BranchesService } from './branches.service';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ResponseMessage } from '../../common/decorators/response-message.decorator';

@ApiTags('Branches')
// @ApiBearerAuth('bearer')
@Controller('branches')
// @UseGuards(JwtAuthGuard)
export class BranchesController {
  constructor(private readonly branchesService: BranchesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new branch' })
  @ResponseMessage('Branch created successfully')
  async create(@Body() createBranchDto: CreateBranchDto) {
    return this.branchesService.create(createBranchDto);
  }

  @Get()
  @ApiOperation({ summary: 'Retrieve all branches' })
  @ResponseMessage('Branches retrieved successfully')
  async findAll() {
    return this.branchesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single branch detail' })
  @ResponseMessage('Branch retrieved successfully')
  async findOne(@Param('id') id: string) {
    return this.branchesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update branch details' })
  @ResponseMessage('Branch updated successfully')
  async update(
    @Param('id') id: string,
    @Body() updateBranchDto: UpdateBranchDto,
  ) {
    return this.branchesService.update(id, updateBranchDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a branch' })
  @ResponseMessage('Branch deleted successfully')
  async remove(@Param('id') id: string) {
    await this.branchesService.remove(id);
    return { success: true };
  }
}
