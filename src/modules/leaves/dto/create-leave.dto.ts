import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateLeaveDto {
  @ApiPropertyOptional({ description: 'Employee ObjectId string' })
  @IsOptional()
  @IsString()
  employee?: string;

  @ApiProperty({ description: 'Employee ID (e.g. EMP001)' })
  @IsNotEmpty()
  @IsString()
  employeeId: string;

  @ApiProperty({ description: 'Employee full name' })
  @IsNotEmpty()
  @IsString()
  employeeName: string;

  @ApiProperty({ description: 'Employee email address' })
  @IsNotEmpty()
  @IsString()
  employeeEmail: string;

  @ApiProperty({
    description:
      'Type of leave (Casual Leave, Sick Leave, Paid Leave, Unpaid Leave, etc.)',
    default: 'Casual Leave',
  })
  @IsNotEmpty()
  @IsString()
  leaveType: string;

  @ApiProperty({ description: 'Start date of leave (YYYY-MM-DD)' })
  @IsNotEmpty()
  @IsDateString()
  startDate: string;

  @ApiProperty({ description: 'End date of leave (YYYY-MM-DD)' })
  @IsNotEmpty()
  @IsDateString()
  endDate: string;

  @ApiPropertyOptional({ description: 'Whether leave is half day', default: false })
  @IsOptional()
  @IsBoolean()
  isHalfDay?: boolean;

  @ApiPropertyOptional({
    description: 'Session for half day (First Half, Second Half, Full Day)',
    default: 'Full Day',
  })
  @IsOptional()
  @IsString()
  halfDaySession?: string;

  @ApiProperty({ description: 'Reason for leave application' })
  @IsNotEmpty()
  @IsString()
  reason: string;
}
