import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { LocationsService } from './locations.service';
import { ResponseMessage } from '../../common/decorators/response-message.decorator';

@ApiTags('Locations')
@Controller('locations')
export class LocationsController {
  constructor(private readonly locationsService: LocationsService) {}

  @Get('countries')
  @ApiOperation({ summary: 'Get list of available countries' })
  @ResponseMessage('Countries retrieved successfully')
  async getCountries() {
    return this.locationsService.getCountries();
  }

  @Get('cities')
  @ApiOperation({ summary: 'Get cities by country ISO code' })
  @ResponseMessage('Cities retrieved successfully')
  async getCities(@Query('countryIso') countryIso: string) {
    return this.locationsService.getCities(countryIso || 'IN');
  }

  @Get('pincodes')
  @ApiOperation({ summary: 'Get pincodes by country ISO and city' })
  @ResponseMessage('Pincodes retrieved successfully')
  async getPincodes(
    @Query('countryIso') countryIso: string,
    @Query('city') city: string,
  ) {
    return this.locationsService.getPincodes(countryIso || 'IN', city || '');
  }

  @Get('validate-pincode')
  @ApiOperation({ summary: 'Validate pincode and return locality' })
  @ResponseMessage('Pincode validated successfully')
  async validatePincode(
    @Query('countryIso') countryIso: string,
    @Query('city') city: string,
    @Query('pincode') pincode: string,
  ) {
    return this.locationsService.validatePincode(
      countryIso || 'IN',
      city || '',
      pincode || '',
    );
  }
}
