import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TaskStatus, TaskPriority } from '../schemas/task.schema';
import { AuthUserDto } from '../../auth/dto/auth-response.dto';

export class TaskResponseDto {
  @ApiProperty({
    example: '60d5ed7ab394142e88a38c29',
    description: 'Task unique database ID',
  })
  id: string;

  @ApiProperty({
    example: 'Escort site visit for Priya Sharma',
    description: 'Task summary/headline',
  })
  task: string;

  @ApiPropertyOptional({
    example: 'Show premium 3 BHK apartment.',
    description: 'Task description details',
  })
  description?: string;

  @ApiProperty({
    example: '26-May-2026',
    description: 'Scheduled date of execution',
  })
  scheduledDate: string;

  @ApiProperty({
    example: '3:43pm',
    description: 'Scheduled time of execution',
  })
  scheduleTime: string;

  @ApiPropertyOptional({
    example: 'Bandra Branch',
    description: 'Office branch name',
  })
  branch?: string;

  @ApiProperty({
    example: 'Open',
    enum: TaskStatus,
    description: 'Task execution lifecycle status',
  })
  status: TaskStatus;

  @ApiPropertyOptional({
    example: TaskPriority.MEDIUM,
    enum: TaskPriority,
    description: 'Task priority level',
  })
  priority?: TaskPriority;

  @ApiProperty({
    description: 'CRM agent assigned to this task',
    type: AuthUserDto,
  })
  assignedTo: AuthUserDto;

  @ApiProperty({
    example: '2026-05-26T14:04:03.000Z',
    description: 'Timestamp of creation',
  })
  createdAt: string;

  @ApiProperty({
    example: '2026-05-26T14:04:03.000Z',
    description: 'Timestamp of last modification',
  })
  updatedAt: string;
}
