import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { HolidaysService } from './holidays.service';
import { CreateHolidayDto } from './dto/create-holiday.dto';
import { UpdateHolidayDto } from './dto/update-holiday.dto';

@Controller('holidays')
export class HolidaysController {
  constructor(private readonly holidaysService: HolidaysService) {}

  @Post()
  async create(@Body() createHolidayDto: CreateHolidayDto) {
    return this.holidaysService.create(createHolidayDto);
  }

  @Get()
  async findAll(
    @Query('search') search?: string,
    @Query('type') type?: string,
    @Query('status') status?: string,
    @Query('year') year?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.holidaysService.findAll({
      search,
      type,
      status,
      year,
      page,
      limit,
    });
  }

  @Get('count')
  async getCounts() {
    return this.holidaysService.getCounts();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.holidaysService.findOne(id);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateHolidayDto: UpdateHolidayDto,
  ) {
    return this.holidaysService.update(id, updateHolidayDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.holidaysService.remove(id);
  }

  @Post('notify-employees')
  async notifyEmployees(@Body() body: { holidayId?: string; holiday?: any }) {
    let holidayData = body.holiday;
    if (!holidayData && body.holidayId) {
      holidayData = await this.holidaysService.findOne(body.holidayId);
    }
    if (!holidayData) {
      return { success: false, message: 'No holiday data provided.' };
    }
    return this.holidaysService.sendHolidayEmailNotificationToEmployees(holidayData);
  }
}
