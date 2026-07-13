import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiCreatedResponse,
  ApiOkResponse,
} from '@nestjs/swagger';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { QueryProjectDto } from './dto/query-project.dto';
import { SendProjectProposalDto } from './dto/send-project-proposal.dto';
import { ResponseMessage } from '../../common/decorators/response-message.decorator';
import { ProjectStatus } from './schemas/project.schema';

@ApiTags('Projects')
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new CRM Project' })
  @ApiCreatedResponse({
    description: 'Project successfully created.',
  })
  @ResponseMessage('Project created successfully')
  async create(@Body() createProjectDto: CreateProjectDto) {
    return this.projectsService.create(createProjectDto);
  }

  @Get()
  @ApiOperation({ summary: 'List and filter CRM Projects' })
  @ApiOkResponse({
    description: 'Projects matching filters retrieved successfully.',
  })
  @ResponseMessage('Projects retrieved successfully')
  async findAll(@Query() queryProjectDto: QueryProjectDto) {
    return this.projectsService.findAll(queryProjectDto);
  }

  @Get('available')
  @ApiOperation({ summary: 'List and filter CRM Available Projects' })
  @ApiOkResponse({
    description: 'Available Projects matching filters retrieved successfully.',
  })
  @ResponseMessage('Available Projects retrieved successfully')
  async findAvailable(@Query() queryProjectDto: QueryProjectDto) {
    return this.projectsService.findAll(
      queryProjectDto,
      ProjectStatus.AVAILABLE,
    );
  }

  @Get('all')
  @ApiOperation({
    summary: 'List and filter All CRM Projects (Available & Sold)',
  })
  @ApiOkResponse({
    description: 'All Projects matching filters retrieved successfully.',
  })
  @ResponseMessage('All Projects retrieved successfully')
  async findAllProjects(@Query() queryProjectDto: QueryProjectDto) {
    return this.projectsService.findAll(queryProjectDto);
  }

  @Get('rera-hira')
  @ApiOperation({
    summary: 'List and filter CRM RERA/HIRA Registered Projects',
  })
  @ApiOkResponse({
    description: 'RERA/HIRA Projects matching filters retrieved successfully.',
  })
  @ResponseMessage('RERA/HIRA Projects retrieved successfully')
  async findReraProjects(@Query() queryProjectDto: QueryProjectDto) {
    return this.projectsService.findAll(queryProjectDto, undefined, true);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Find a single CRM Project by ID' })
  @ApiOkResponse({
    description: 'Project found.',
  })
  @ResponseMessage('Project details retrieved successfully')
  async findOne(@Param('id') id: string) {
    return this.projectsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Modify an existing CRM Project' })
  @ApiOkResponse({
    description: 'Project modified successfully.',
  })
  @ResponseMessage('Project updated successfully')
  async update(
    @Param('id') id: string,
    @Body() updateProjectDto: UpdateProjectDto,
  ) {
    return this.projectsService.update(id, updateProjectDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a CRM Project' })
  @ApiOkResponse({
    description: 'Project deleted.',
  })
  @ResponseMessage('Project deleted successfully')
  async remove(@Param('id') id: string) {
    await this.projectsService.remove(id);
    return null;
  }

  @Post('actions/import')
  @ApiOperation({ summary: 'Import projects in bulk from spreadsheet data' })
  @ResponseMessage('Projects imported successfully')
  async importProjects(@Body() projects: any[]) {
    return this.projectsService.importProjects(projects);
  }

  @Post(':id/actions/send-proposal')
  @ApiOperation({ summary: 'Send project proposal email' })
  @ResponseMessage('Proposal successfully sent')
  async sendProposal(
    @Param('id') id: string,
    @Body() dto: SendProjectProposalDto,
  ) {
    return this.projectsService.sendProposal(id, dto);
  }
}
