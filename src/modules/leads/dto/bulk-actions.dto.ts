import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsOptional, IsString } from 'class-validator';

export class SendGroupSmsDto {
  @ApiProperty({ example: 'Festival Template' })
  @IsString()
  template: string;

  @ApiProperty({ example: '123456789012345678' })
  @IsString()
  dltTemplateId: string;

  @ApiProperty({ example: 'Hello, check out our new lead updates!' })
  @IsString()
  message: string;

  @ApiProperty({ example: '2026-05-29' })
  @IsString()
  scheduleDate: string;

  @ApiProperty({ example: '11:49am' })
  @IsString()
  scheduleTime: string;

  @ApiPropertyOptional({ type: [String] })
  @IsArray()
  @IsOptional()
  leadIds?: string[];
}

export class SendGroupEmailDto {
  @ApiProperty({ example: 'Premium Template' })
  @IsString()
  template: string;

  @ApiProperty({ example: 'Exciting New Offers!' })
  @IsString()
  subject: string;

  @ApiProperty({ example: '<p>Hello, check out this content</p>' })
  @IsString()
  message: string;

  @ApiProperty({ example: '2026-05-29' })
  @IsString()
  scheduleDate: string;

  @ApiProperty({ example: '11:50am' })
  @IsString()
  scheduleTime: string;

  @ApiPropertyOptional({ type: [String] })
  @IsArray()
  @IsOptional()
  leadIds?: string[];
}

export class GroupDeleteDto {
  @ApiPropertyOptional({ type: [String] })
  @IsArray()
  @IsOptional()
  leadIds?: string[];
}
