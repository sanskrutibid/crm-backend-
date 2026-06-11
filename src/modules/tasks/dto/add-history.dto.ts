import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class AddHistoryDto {
  @ApiProperty({
    example: 'Discussed project deadlines with the client.',
    description: 'Description of the conversation / what was discussed.',
  })
  @IsString()
  @IsNotEmpty({ message: 'Comment details are required' })
  comment: string;

  @ApiPropertyOptional({
    example: 'Call',
    enum: ['Call', 'Meeting', 'None'],
    description: 'Type of next action to take.',
  })
  @IsString()
  @IsOptional()
  nextAction?: string;

  @ApiPropertyOptional({
    example: '2026-06-12',
    description: 'Scheduled date of the next follow-up action.',
  })
  @IsString()
  @IsOptional()
  nextDate?: string;

  @ApiPropertyOptional({
    example: '4:30pm',
    description: 'Scheduled time of the next follow-up action.',
  })
  @IsString()
  @IsOptional()
  nextTime?: string;

  @ApiPropertyOptional({
    example: 'High',
    enum: ['Low', 'Medium', 'High'],
    description: 'Updated priority of the task.',
  })
  @IsString()
  @IsOptional()
  priority?: string;
}
