import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsEnum, IsOptional, IsString } from 'class-validator';
import { ActivityType } from '../schemas/activity.schema';

export class CreateActivityDto {
  @ApiProperty({
    example: 'Booking confirmed! Token received for Skyline Business Hub',
    description: 'Text detail explaining the operation or system event',
  })
  @IsString()
  @IsNotEmpty({ message: 'Description is required' })
  description: string;

  @ApiPropertyOptional({
    example: ActivityType.LEAD,
    enum: ActivityType,
    description: 'Category grouping classification',
    default: ActivityType.SYSTEM,
  })
  @IsEnum(ActivityType, { message: 'Invalid activity type' })
  @IsOptional()
  type?: ActivityType;

  @ApiPropertyOptional({
    example: '60d5ecb8b394142e88a38c21',
    description: 'User ID of the agent who performed this action',
  })
  @IsString()
  @IsOptional()
  performedBy?: string;
}
