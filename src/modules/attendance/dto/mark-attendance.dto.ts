import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class MarkAttendanceDto {
  @ApiProperty({
    example: '65b2a3c2f1a9b2c3d4e5f6a7',
    description: 'User ID of the employee',
  })
  @IsNotEmpty({ message: 'User ID is required' })
  @IsString()
  userId: string;

  @ApiProperty({
    example: '2026-07-31',
    description: 'Date in YYYY-MM-DD format',
  })
  @IsNotEmpty({ message: 'Date is required' })
  @IsString()
  date: string;

  @ApiProperty({
    example: 'Present',
    description: 'Manual attendance status (Present, Absent, Late, Leave, Half Day)',
  })
  @IsNotEmpty({ message: 'Status is required' })
  @IsString()
  status: string;

  @ApiProperty({
    example: '09:00',
    description: 'Check-in time (HH:MM)',
  })
  @IsOptional()
  @IsString()
  checkIn?: string;

  @ApiProperty({
    example: '18:00',
    description: 'Check-out time (HH:MM)',
  })
  @IsOptional()
  @IsString()
  checkOut?: string;

  @ApiProperty({
    example: '09:00',
    description: 'Total working hours (HH:MM)',
  })
  @IsOptional()
  @IsString()
  workingHours?: string;

  @ApiProperty({
    example: '00:00',
    description: 'Late entry duration (HH:MM)',
  })
  @IsOptional()
  @IsString()
  lateBy?: string;

  @ApiProperty({
    example: 'Approved leave request',
    description: 'Remarks or comments for manual marking',
  })
  @IsOptional()
  @IsString()
  remarks?: string;
}
