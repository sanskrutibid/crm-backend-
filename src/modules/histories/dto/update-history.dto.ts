import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsDateString } from 'class-validator';
import { HistoryPriority } from '../schemas/history.schema';

export class UpdateHistoryDto {
  @ApiPropertyOptional({
    example: '60d5ecb8b394142e88a38c21',
    description: 'The MongoDB ObjectId of the contact (client)',
  })
  @IsString()
  @IsOptional()
  contactId?: string;

  @ApiPropertyOptional({
    example: 'Discussed pricing for the 3 BHK row house, client requested discount.',
    description: 'Updated conversation details',
  })
  @IsString()
  @IsOptional()
  conversation?: string;

  @ApiPropertyOptional({
    example: '2026-06-10T12:00:00.000Z',
    description: 'Updated date/time of conversation',
  })
  @IsDateString()
  @IsOptional()
  date?: string;

  @ApiPropertyOptional({
    example: HistoryPriority.HIGH,
    enum: HistoryPriority,
    description: 'Updated priority of the conversation',
  })
  @IsEnum(HistoryPriority, { message: 'Invalid history priority value' })
  @IsOptional()
  priority?: HistoryPriority;

  @ApiPropertyOptional({
    example: '60d5ecb8b394142e88a38c22',
    description: 'Updated related project ID',
  })
  @IsString()
  @IsOptional()
  projectId?: string;

  @ApiPropertyOptional({
    example: 'Mumbai Bandra Office',
    description: 'Updated location details',
  })
  @IsString()
  @IsOptional()
  location?: string;
}
