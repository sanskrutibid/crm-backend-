import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiCreatedResponse,
  ApiOkResponse,
} from '@nestjs/swagger';
import { AttendanceService } from './attendance.service';
import { PunchInDto } from './dto/punch-in.dto';
import { PunchOutDto } from './dto/punch-out.dto';
import { TrackLocationDto } from './dto/track-location.dto';
import { MarkAttendanceDto } from './dto/mark-attendance.dto';
import { AgentMovementTimelineDto } from './dto/attendance-response.dto';
import { ResponseMessage } from '../../common/decorators/response-message.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Attendance & Location Tracking')
@Controller('attendance')
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Post('punch-in')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Punch-In shift startup' })
  @ApiCreatedResponse({
    description:
      'Shift punched in and initial coordinates registered successfully.',
  })
  @ResponseMessage('Punch-in completed successfully')
  async punchIn(@Req() req: any, @Body() punchInDto: PunchInDto) {
    const activeUserId = req.user.id;
    return this.attendanceService.punchIn(activeUserId, punchInDto);
  }

  @Post('punch-out')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Punch-Out shift shutdown' })
  @ApiOkResponse({
    description: 'Shift closed and final coordinates registered successfully.',
  })
  @ResponseMessage('Punch-out completed successfully')
  async punchOut(@Req() req: any, @Body() punchOutDto: PunchOutDto) {
    const activeUserId = req.user.id;
    return this.attendanceService.punchOut(activeUserId, punchOutDto);
  }

  @Post('track')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Push dynamic background location update' })
  @ApiOkResponse({
    description: 'GPS tracking point added to shift path logs.',
  })
  @ResponseMessage('Location tracking point registered successfully')
  async trackLocation(
    @Req() req: any,
    @Body() trackLocationDto: TrackLocationDto,
  ) {
    const activeUserId = req.user.id;
    return this.attendanceService.trackLocation(activeUserId, trackLocationDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get all attendance records' })
  @ResponseMessage('All attendance records retrieved successfully')
  async getAllAttendance() {
    return this.attendanceService.getAllAttendance();
  }

  @Post('manual-mark')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Manually mark attendance by Admin' })
  @ApiOkResponse({
    description: 'Attendance manually saved/updated successfully.',
  })
  @ResponseMessage('Attendance manually marked successfully')
  async saveManualAttendance(@Body() markAttendanceDto: MarkAttendanceDto) {
    return this.attendanceService.saveManualAttendance(markAttendanceDto);
  }

  @Get('agent/:userId/timeline')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Retrieve comprehensive agent route timeline and stops',
  })
  @ApiOkResponse({
    description:
      'Calculated metrics, geodetic coordinates list, and holding points generated successfully.',
    type: AgentMovementTimelineDto,
  })
  @ResponseMessage('Agent movement timeline retrieved successfully')
  async getAgentTimeline(
    @Param('userId') userId: string,
    @Query('date') date: string,
  ) {
    const cleanUserId = userId
      ? userId.trim().replace(/^["']|["']$/g, '')
      : userId;
    const queryDate = date || new Date().toISOString().split('T')[0];
    return this.attendanceService.getAgentTimeline(cleanUserId, queryDate);
  }
}
