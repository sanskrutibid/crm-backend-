import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { LoginHistoryService } from './login-history.service';
import { QueryLoginHistoryDto } from './dto/query-login-history.dto';
import { ResponseMessage } from '../../common/decorators/response-message.decorator';
import { UserRole } from '../users/schemas/user.schema';

@ApiTags('Login History')
@ApiBearerAuth('bearer')
@Controller('login-history')
export class LoginHistoryController {
  constructor(private readonly loginHistoryService: LoginHistoryService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Retrieve login and logout histories' })
  @ApiOkResponse({
    description: 'Histories retrieved successfully.',
  })
  @ResponseMessage('Auth histories retrieved successfully')
  async findAll(@Query() query: QueryLoginHistoryDto, @Req() req: any) {
    const user = req.user;
    const forceUserId = user.role === UserRole.ADMIN ? undefined : user.id;
    return this.loginHistoryService.findAll(query, forceUserId);
  }
}
