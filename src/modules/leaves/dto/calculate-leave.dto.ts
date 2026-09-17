import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsDateString, IsNotEmpty, IsOptional } from 'class-validator';

export class CalculateLeaveDto {
  @ApiProperty({ description: 'Start date (YYYY-MM-DD)' })
  @IsNotEmpty()
  @IsDateString()
  startDate: string;

  @ApiProperty({ description: 'End date (YYYY-MM-DD)' })
  @IsNotEmpty()
  @IsDateString()
  endDate: string;

  @ApiPropertyOptional({ description: 'Whether leave is half day', default: false })
  @IsOptional()
  @IsBoolean()
  isHalfDay?: boolean;
}
