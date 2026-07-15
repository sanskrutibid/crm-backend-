import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiOkResponse } from '@nestjs/swagger';
import { MatchmakingService } from './matchmaking.service';
import { ResponseMessage } from '../../common/decorators/response-message.decorator';

@ApiTags('Matchmaking')
@Controller('matchmaking')
export class MatchmakingController {
  constructor(private readonly matchmakingService: MatchmakingService) {}

  @Get('opportunities/:id/matches')
  @ApiOperation({
    summary: 'Get all matching Opportunities, Properties, and Projects for a given Opportunity',
  })
  @ApiQuery({ name: 'radiusKm', required: false, type: Number, example: 5 })
  @ApiQuery({ name: 'priceTolerancePct', required: false, type: Number, example: 10 })
  @ApiQuery({ name: 'areaTolerancePct', required: false, type: Number, example: 10 })
  @ApiOkResponse({ description: 'Matches retrieved successfully' })
  @ResponseMessage('Matches for Opportunity retrieved successfully')
  async getOpportunityMatches(
    @Param('id') id: string,
    @Query('radiusKm') radiusKm?: number,
    @Query('priceTolerancePct') priceTolerancePct?: number,
    @Query('areaTolerancePct') areaTolerancePct?: number,
  ) {
    return this.matchmakingService.findMatchesForOpportunity(
      id,
      radiusKm ? Number(radiusKm) : undefined,
      priceTolerancePct ? Number(priceTolerancePct) : undefined,
      areaTolerancePct ? Number(areaTolerancePct) : undefined,
    );
  }

  @Get('properties/:id/matches')
  @ApiOperation({
    summary: 'Get all matching Opportunities for a given Property',
  })
  @ApiQuery({ name: 'radiusKm', required: false, type: Number, example: 5 })
  @ApiQuery({ name: 'priceTolerancePct', required: false, type: Number, example: 10 })
  @ApiQuery({ name: 'areaTolerancePct', required: false, type: Number, example: 10 })
  @ApiOkResponse({ description: 'Matching Opportunities retrieved successfully' })
  @ResponseMessage('Matches for Property retrieved successfully')
  async getPropertyMatches(
    @Param('id') id: string,
    @Query('radiusKm') radiusKm?: number,
    @Query('priceTolerancePct') priceTolerancePct?: number,
    @Query('areaTolerancePct') areaTolerancePct?: number,
  ) {
    return this.matchmakingService.findMatchesForProperty(
      id,
      radiusKm ? Number(radiusKm) : undefined,
      priceTolerancePct ? Number(priceTolerancePct) : undefined,
      areaTolerancePct ? Number(areaTolerancePct) : undefined,
    );
  }

  @Get('projects/:id/matches')
  @ApiOperation({
    summary: 'Get all matching Opportunities for a given Project',
  })
  @ApiQuery({ name: 'radiusKm', required: false, type: Number, example: 5 })
  @ApiQuery({ name: 'priceTolerancePct', required: false, type: Number, example: 10 })
  @ApiQuery({ name: 'areaTolerancePct', required: false, type: Number, example: 10 })
  @ApiOkResponse({ description: 'Matching Opportunities retrieved successfully' })
  @ResponseMessage('Matches for Project retrieved successfully')
  async getProjectMatches(
    @Param('id') id: string,
    @Query('radiusKm') radiusKm?: number,
    @Query('priceTolerancePct') priceTolerancePct?: number,
    @Query('areaTolerancePct') areaTolerancePct?: number,
  ) {
    return this.matchmakingService.findMatchesForProject(
      id,
      radiusKm ? Number(radiusKm) : undefined,
      priceTolerancePct ? Number(priceTolerancePct) : undefined,
      areaTolerancePct ? Number(areaTolerancePct) : undefined,
    );
  }
}
