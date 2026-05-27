import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { TaskStatus } from '../schemas/task.schema';

export class UpdateTaskDto {
  @ApiPropertyOptional({
    example: 'Escort site visit for Priya Sharma',
    description: 'Updated task summary/headline text',
  })
  @IsString()
  @IsOptional()
  task?: string;

  @ApiPropertyOptional({
    example: 'Updated details for site escort visit and booking forms check.',
    description: 'Updated task description details',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    example: '27-May-2026',
    description: 'Updated scheduled date',
  })
  @IsString()
  @IsOptional()
  scheduledDate?: string;

  @ApiPropertyOptional({
    example: '4:00pm',
    description: 'Updated scheduled time',
  })
  @IsString()
  @IsOptional()
  scheduleTime?: string;

  @ApiPropertyOptional({
    example: 'Noida Hub Branch',
    description: 'Updated assigned office branch location',
  })
  @IsString()
  @IsOptional()
  branch?: string;

  @ApiPropertyOptional({
    example: TaskStatus.CLOSED,
    enum: TaskStatus,
    description: 'Updated lifecycle status of the task',
  })
  @IsEnum(TaskStatus, { message: 'Invalid task status' })
  @IsOptional()
  status?: TaskStatus;

  @ApiPropertyOptional({
    example: '60d5ecb8b394142e88a38c21',
    description: 'Reassigned CRM User ID',
  })
  @IsString()
  @IsOptional()
  assignedTo?: string;
}
