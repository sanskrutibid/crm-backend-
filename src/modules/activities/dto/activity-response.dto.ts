import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ActivityType } from '../schemas/activity.schema';
import { AuthUserDto } from '../../auth/dto/auth-response.dto';

export class ActivityResponseDto {
  @ApiProperty({ example: '60d5ed7ab394142e88a38c29', description: 'Log item database ID' })
  id: string;

  @ApiProperty({ example: 'Booking confirmed! Token received for Skyline Business Hub', description: 'Operational description' })
  description: string;

  @ApiProperty({ example: 'lead', enum: ActivityType, description: 'Category grouping type classification' })
  type: ActivityType;

  @ApiProperty({ example: '2026-05-26T14:04:03.000Z', description: 'Event execution timestamp' })
  timestamp: string;

  @ApiPropertyOptional({ description: 'User profile executing this operation', type: AuthUserDto })
  performedBy?: AuthUserDto;

  @ApiProperty({ example: '2026-05-26T14:04:03.000Z', description: 'Record database generation timestamp' })
  createdAt: string;

  @ApiProperty({ example: '2026-05-26T14:04:03.000Z', description: 'Record database last modification timestamp' })
  updatedAt: string;
}
