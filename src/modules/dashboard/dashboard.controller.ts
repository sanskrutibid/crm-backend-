import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { ResponseMessage } from '../../common/decorators/response-message.decorator';

@ApiTags('Dashboard')
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Get aggregated dashboard statistics and yearly trends' })
  @ApiOkResponse({
    description: 'Dashboard statistics retrieved successfully.',
  })
  @ResponseMessage('Dashboard stats retrieved successfully')
  async getStats() {
    return this.dashboardService.getStats();
  }
}
