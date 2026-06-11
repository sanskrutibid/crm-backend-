import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsEnum, IsOptional, IsString, IsDateString } from 'class-validator';
import { HistoryPriority } from '../schemas/history.schema';

export class CreateHistoryDto {
  @ApiProperty({
    example: '60d5ecb8b394142e88a38c21',
    description: 'The MongoDB ObjectId of the contact (client)',
  })
  @IsString()
  @IsNotEmpty({ message: 'Contact ID is required' })
  contactId: string;

  @ApiProperty({
    example: 'Discussed pricing for the 3 BHK row house, client requested discount.',
    description: 'Details of the talk/conversation had with the client',
  })
  @IsString()
  @IsNotEmpty({ message: 'Conversation content is required' })
  conversation: string;

  @ApiPropertyOptional({
    example: '2026-06-10T12:00:00.000Z',
    description: 'Date and time when the conversation occurred',
  })
  @IsDateString()
  @IsOptional()
  date?: string;

  @ApiPropertyOptional({
    example: HistoryPriority.LOW,
    enum: HistoryPriority,
    description: 'Priority of the conversation',
    default: HistoryPriority.LOW,
  })
  @IsEnum(HistoryPriority, { message: 'Invalid history priority value' })
  @IsOptional()
  priority?: HistoryPriority;

  @ApiPropertyOptional({
    example: '60d5ecb8b394142e88a38c22',
    description: 'The MongoDB ObjectId of the related project',
  })
  @IsString()
  @IsOptional()
  projectId?: string;

  @ApiPropertyOptional({
    example: 'Mumbai Bandra Office',
    description: 'Location where meeting or conversation took place',
  })
  @IsString()
  @IsOptional()
  location?: string;
}
