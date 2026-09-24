import {
  BadRequestException,
  Controller,
  Get,
  Query,
} from '@nestjs/common';

import { LocalitiesService } from './localities.service';

// Final URL with global prefix 'api/v1':
// GET /api/v1/localities?city=Pune

@Controller('localities')
export class LocalitiesController {

  constructor(
    private readonly localitiesService: LocalitiesService,
  ) {}

  // ============================================================
  // GET LOCALITIES BY CITY
  // ============================================================
  //
  // Final URL:
  // GET /api/v1/localities?city=Pune
  //
  // This endpoint is only responsible for localities.
  // Cities are now handled by the separate CitiesModule.
  // ============================================================

  @Get()
  async getLocalities(
    @Query('city') city: string,
  ) {

    if (
      !city ||
      !city.trim()
    ) {

      throw new BadRequestException(
        'city is required',
      );
    }

    const data =
      await this.localitiesService.getLocalities(
        city,
      );

    return {
      data,
    };
  }
}