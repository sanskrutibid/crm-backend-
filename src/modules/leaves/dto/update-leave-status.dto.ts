import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export enum LeaveStatus {
  PENDING = 'Pending',
  APPROVED = 'Approved',
  DECLINED = 'Declined',
  CANCELLED = 'Cancelled',
}

export class UpdateLeaveStatusDto {
  @ApiProperty({ description: 'New leave status', enum: LeaveStatus })
  @IsNotEmpty()
  @IsEnum(LeaveStatus)
  status: LeaveStatus;

  @ApiPropertyOptional({
    description: 'Name or ID of admin/manager taking action',
  })
  @IsOptional()
  @IsString()
  actionBy?: string;

  @ApiPropertyOptional({
    description: 'Comments or reason for approval / rejection',
  })
  @IsOptional()
  @IsString()
  actionReason?: string;
}
