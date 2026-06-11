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
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { QueryTaskDto } from './dto/query-task.dto';
import { AddHistoryDto } from './dto/add-history.dto';
import { TaskResponseDto } from './dto/task-response.dto';
import { ResponseMessage } from '../../common/decorators/response-message.decorator';

@ApiTags('Tasks')
@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new CRM Task' })
  @ApiCreatedResponse({
    description: 'Task successfully created.',
    type: TaskResponseDto,
  })
  @ResponseMessage('Task created successfully')
  async create(@Body() createTaskDto: CreateTaskDto) {
    return this.tasksService.create(createTaskDto);
  }

  @Get()
  @ApiOperation({ summary: 'List and filter CRM Tasks' })
  @ApiOkResponse({
    description: 'Tasks matching filters retrieved successfully.',
    type: [TaskResponseDto],
  })
  @ResponseMessage('Tasks retrieved successfully')
  async findAll(@Query() queryTaskDto: QueryTaskDto) {
    return this.tasksService.findAll(queryTaskDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Find a single Task by database ID' })
  @ApiOkResponse({
    description: 'Task found.',
    type: TaskResponseDto,
  })
  @ResponseMessage('Task details retrieved successfully')
  async findOne(@Param('id') id: string) {
    return this.tasksService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Modify an existing CRM Task' })
  @ApiOkResponse({
    description: 'Task modified successfully.',
    type: TaskResponseDto,
  })
  @ResponseMessage('Task updated successfully')
  async update(@Param('id') id: string, @Body() updateTaskDto: UpdateTaskDto) {
    return this.tasksService.update(id, updateTaskDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a CRM Task' })
  @ApiOkResponse({
    description: 'Task deleted.',
  })
  @ResponseMessage('Task deleted successfully')
  async remove(@Param('id') id: string) {
    await this.tasksService.remove(id);
    return null;
  }

  @Post(':id/history')
  @ApiOperation({ summary: 'Add history/discussion log to a task' })
  @ResponseMessage('History logged successfully')
  async addHistory(
    @Param('id') id: string,
    @Body() addHistoryDto: AddHistoryDto,
  ) {
    return this.tasksService.addHistory(id, addHistoryDto);
  }
}
