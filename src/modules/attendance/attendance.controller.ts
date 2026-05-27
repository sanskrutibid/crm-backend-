import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiCreatedResponse, ApiOkResponse } from '@nestjs/swagger';
import { AttendanceService } from './attendance.service';
import { PunchInDto } from './dto/punch-in.dto';
import { PunchOutDto } from './dto/punch-out.dto';
import { TrackLocationDto } from './dto/track-location.dto';
import { AgentMovementTimelineDto } from './dto/attendance-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ResponseMessage } from '../../common/decorators/response-message.decorator';

@ApiTags('Attendance & Location Tracking')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('attendance')
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Post('punch-in')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Punch-In shift startup' })
  @ApiCreatedResponse({
    description: 'Shift punched in and initial coordinates registered successfully.',
  })
  @ResponseMessage('Punch-in completed successfully')
  async punchIn(@Body() punchInDto: PunchInDto, @Req() req: any) {
    const activeUserId = req.user.id;
    return this.attendanceService.punchIn(activeUserId, punchInDto);
  }

  @Post('punch-out')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Punch-Out shift shutdown' })
  @ApiOkResponse({
    description: 'Shift closed and final coordinates registered successfully.',
  })
  @ResponseMessage('Punch-out completed successfully')
  async punchOut(@Body() punchOutDto: PunchOutDto, @Req() req: any) {
    const activeUserId = req.user.id;
    return this.attendanceService.punchOut(activeUserId, punchOutDto);
  }

  @Post('track')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Push dynamic background location update' })
  @ApiOkResponse({
    description: 'GPS tracking point added to shift path logs.',
  })
  @ResponseMessage('Location tracking point registered successfully')
  async trackLocation(@Body() trackLocationDto: TrackLocationDto, @Req() req: any) {
    const activeUserId = req.user.id;
    return this.attendanceService.trackLocation(activeUserId, trackLocationDto);
  }

  @Get('agent/:userId/timeline')
  @ApiOperation({ summary: 'Retrieve comprehensive agent route timeline and stops' })
  @ApiOkResponse({
    description: 'Calculated metrics, geodetic coordinates list, and holding points generated successfully.',
    type: AgentMovementTimelineDto,
  })
  @ResponseMessage('Agent movement timeline retrieved successfully')
  async getAgentTimeline(
    @Param('userId') userId: string,
    @Query('date') date: string,
  ) {
    const cleanUserId = userId ? userId.trim().replace(/^["']|["']$/g, '') : userId;
    const queryDate = date || new Date().toISOString().split('T')[0];
    return this.attendanceService.getAgentTimeline(cleanUserId, queryDate);
  }
}
