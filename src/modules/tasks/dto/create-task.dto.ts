import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsEnum, IsOptional, IsString } from 'class-validator';
import { TaskStatus } from '../schemas/task.schema';

export class CreateTaskDto {
  @ApiProperty({
    example: 'Escort site visit for Priya Sharma',
    description: 'Headline or summary of the task to perform',
  })
  @IsString()
  @IsNotEmpty({ message: 'Task summary is required' })
  task: string;

  @ApiPropertyOptional({
    example:
      'Show premium 3 BHK apartment, explain booking terms and token amounts.',
    description: 'Detailed description of follow-up action details',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    example: '26-May-2026',
    description: 'Scheduled execution date',
  })
  @IsString()
  @IsOptional()
  scheduledDate?: string;

  @ApiPropertyOptional({
    example: '26-May-2026',
    description: 'Scheduled execution date (alternative parameter)',
  })
  @IsString()
  @IsOptional()
  scheduleDate?: string;

  @ApiProperty({
    example: '3:43pm',
    description: 'Scheduled execution time',
  })
  @IsString()
  @IsNotEmpty({ message: 'Schedule Time is required' })
  scheduleTime: string;

  @ApiPropertyOptional({
    example: 'Mumbai Bandra Branch',
    description: 'Assigned CRM office branch location name',
  })
  @IsString()
  @IsOptional()
  branch?: string;

  @ApiPropertyOptional({
    example: TaskStatus.OPEN,
    enum: TaskStatus,
    description: 'Current lifecycle status of the task',
    default: TaskStatus.OPEN,
  })
  @IsEnum(TaskStatus, { message: 'Invalid task status' })
  @IsOptional()
  status?: TaskStatus;

  @ApiPropertyOptional({
    example: '60d5ecb8b394142e88a38c21',
    description: 'Assigned CRM User ID. Defaults to the requesting user.',
  })
  @IsString()
  @IsOptional()
  assignedTo?: string;
}
