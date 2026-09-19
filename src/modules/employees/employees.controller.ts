import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Query,
} from '@nestjs/common';

import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

import { EmployeesService } from './employees.service';

import { CreateEmployeeDto } from './dto/create-employee.dto';

import { UpdateEmployeeDto } from './dto/update-employee.dto';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

import { ResponseMessage } from '../../common/decorators/response-message.decorator';

@ApiTags('Employees')
@ApiBearerAuth('bearer')
@Controller('employees')
export class EmployeesController {
  constructor(private readonly employeesService: EmployeesService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Create a new employee' })
  @ResponseMessage('Employee created successfully')
  async create(@Body() createEmployeeDto: CreateEmployeeDto) {
    return this.employeesService.create(createEmployeeDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Retrieve all employees' })
  @ResponseMessage('Employees retrieved successfully')
  async findAll() {
    return this.employeesService.findAll();
  }

  @Get('next-id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Retrieve the next auto-generated Employee ID' })
  @ResponseMessage('Next Employee ID retrieved successfully')
  async getNextEmployeeId(
    @Query('firstName') firstName?: string,
    @Query('lastName') lastName?: string,
    @Query('designation') designation?: string,
    @Query('dob') dob?: string,
    @Query('joiningDate') joiningDate?: string,
  ) {
    const nextId = await this.employeesService.generateNextEmployeeId({
      firstName,
      lastName,
      designation,
      dob,
      joiningDate,
    });

    return { nextId };
  }

  /*
   * IMPORTANT:
   * This route MUST be above @Get(':id').
   *
   * It gets employee names directly from the Employee collection
   * for the Opportunity Source dropdown.
   */
  @Get('source-options')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Retrieve employees for the Source dropdown',
  })
  @ResponseMessage('Employee source options retrieved successfully')
  async findSourceOptions() {
    return this.employeesService.findSourceOptions();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Retrieve specific employee details by ID or Employee ID',
  })
  @ResponseMessage('Employee retrieved successfully')
  async findOne(@Param('id') id: string) {
    return this.employeesService.findOne(id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Update employee details' })
  @ResponseMessage('Employee updated successfully')
  async update(
    @Param('id') id: string,
    @Body() updateEmployeeDto: UpdateEmployeeDto,
  ) {
    return this.employeesService.update(id, updateEmployeeDto);
  }

  @Put(':id/status')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Update employee status (Active/Inactive)',
  })
  @ResponseMessage('Employee status updated successfully')
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: string,
  ) {
    return this.employeesService.updateStatus(id, status);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Delete/Remove an employee' })
  @ResponseMessage('Employee deleted successfully')
  async remove(@Param('id') id: string) {
    return this.employeesService.remove(id);
  }
}