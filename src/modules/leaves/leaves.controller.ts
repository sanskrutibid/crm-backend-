import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiCreatedResponse,
  ApiOkResponse,
} from '@nestjs/swagger';
import { LeavesService } from './leaves.service';
import { CreateLeaveDto } from './dto/create-leave.dto';
import { UpdateLeaveStatusDto } from './dto/update-leave-status.dto';
import { QueryLeaveDto } from './dto/query-leave.dto';
import { CalculateLeaveDto } from './dto/calculate-leave.dto';
import { ResponseMessage } from '../../common/decorators/response-message.decorator';

@ApiTags('Leave Management')
@Controller('leaves')
export class LeavesController {
  constructor(private readonly leavesService: LeavesService) {}

  @Post('calculate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Calculate leave days between dates' })
  @ApiOkResponse({ description: 'Leave duration calculated successfully' })
  @ResponseMessage('Leave duration calculated successfully')
  async calculateLeave(@Body() dto: CalculateLeaveDto) {
    return this.leavesService.calculateLeave(dto);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Apply / Create a new leave request' })
  @ApiCreatedResponse({ description: 'Leave application submitted successfully' })
  @ResponseMessage('Leave application submitted successfully')
  async create(@Body() createLeaveDto: CreateLeaveDto) {
    return this.leavesService.create(createLeaveDto);
  }

  @Get()
  @ApiOperation({ summary: 'Fetch all leave requests with filters & pagination' })
  @ApiOkResponse({ description: 'Leave requests list retrieved successfully' })
  @ResponseMessage('Leave requests list retrieved successfully')
  async findAll(@Query() query: QueryLeaveDto) {
    return this.leavesService.findAll(query);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get summary statistics of leave requests' })
  @ApiOkResponse({ description: 'Leave stats retrieved successfully' })
  @ResponseMessage('Leave stats retrieved successfully')
  async getStats(@Query('employeeId') employeeId?: string) {
    return this.leavesService.getLeaveStats(employeeId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get details of a specific leave request' })
  @ApiOkResponse({ description: 'Leave details retrieved successfully' })
  @ResponseMessage('Leave details retrieved successfully')
  async findOne(@Param('id') id: string) {
    return this.leavesService.findOne(id);
  }

  @Put(':id/status')
  @ApiOperation({
    summary: 'Approve or Decline a leave request and send email notification to employee',
  })
  @ApiOkResponse({ description: 'Leave status updated and email sent successfully' })
  @ResponseMessage('Leave status updated successfully')
  async updateStatus(
    @Param('id') id: string,
    @Body() updateLeaveStatusDto: UpdateLeaveStatusDto,
  ) {
    return this.leavesService.updateStatus(id, updateLeaveStatusDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete / Cancel a leave request' })
  @ApiOkResponse({ description: 'Leave request deleted successfully' })
  @ResponseMessage('Leave request deleted successfully')
  async remove(@Param('id') id: string) {
    return this.leavesService.remove(id);
  }
}
