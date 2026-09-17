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
import { FoldersService } from './folders.service';
import { CreateFolderDto } from './dto/create-folder.dto';
import { UpdateFolderDto } from './dto/update-folder.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ResponseMessage } from '../../common/decorators/response-message.decorator';

@ApiTags('Folders')
// @ApiBearerAuth('bearer')
@Controller('folders')
// @UseGuards(JwtAuthGuard)
export class FoldersController {
  constructor(private readonly foldersService: FoldersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new folder' })
  @ResponseMessage('Folder created successfully')
  async create(@Body() createFolderDto: CreateFolderDto) {
    return this.foldersService.create(createFolderDto);
  }

  @Get()
  @ApiOperation({ summary: 'Retrieve all folders' })
  @ResponseMessage('Folders retrieved successfully')
  async findAll() {
    return this.foldersService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single folder detail' })
  @ResponseMessage('Folder retrieved successfully')
  async findOne(@Param('id') id: string) {
    return this.foldersService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update folder details' })
  @ResponseMessage('Folder updated successfully')
  async update(
    @Param('id') id: string,
    @Body() updateFolderDto: UpdateFolderDto,
  ) {
    return this.foldersService.update(id, updateFolderDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a folder' })
  @ResponseMessage('Folder deleted successfully')
  async remove(@Param('id') id: string) {
    await this.foldersService.remove(id);
    return { success: true };
  }
}
