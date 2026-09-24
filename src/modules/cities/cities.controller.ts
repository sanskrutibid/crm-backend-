import {
  Controller,
  Get,
  Post,
} from '@nestjs/common';

import { CitiesService } from './cities.service';

@Controller('cities')
export class CitiesController {

  constructor(
    private readonly citiesService: CitiesService,
  ) {}

  /**
   * GET /cities
   *
   * Returns all active Indian cities.
   *
   * Final API:
   * GET /api/v1/cities
   */
  @Get()
  async getCities() {

    const data =
      await this.citiesService.getCities();

    return {
      data,
    };
  }

  /**
   * POST /cities/sync
   *
   * Fetches Indian cities from CountriesNow
   * and stores them in MongoDB.
   *
   * Final API:
   * POST /api/v1/cities/sync
   */
  @Post('sync')
  async syncCities() {

    const data =
      await this.citiesService.syncCities();

    return {
      data,
    };
  }
}