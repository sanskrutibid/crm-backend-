import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class SendProjectProposalDto {
  @ApiProperty({ example: 'customer@example.com', description: 'Recipient email address' })
  @IsNotEmpty({ message: 'Recipient is required' })
  @IsString()
  to: string;

  @ApiProperty({ example: 'Project Proposal', description: 'Subject of the email' })
  @IsNotEmpty({ message: 'Subject is required' })
  @IsString()
  subject: string;

  @ApiProperty({ example: '<h3>Hello!</h3>', description: 'HTML body content of the email' })
  @IsNotEmpty({ message: 'Email body content is required' })
  @IsString()
  body: string;

  @ApiPropertyOptional({ example: '2026-07-15', description: 'Scheduled send date' })
  @IsOptional()
  @IsString()
  scheduleDate?: string;

  @ApiPropertyOptional({ example: '12:00', description: 'Scheduled send time' })
  @IsOptional()
  @IsString()
  scheduleTime?: string;

  @ApiPropertyOptional({ example: 'General Template', description: 'Template used' })
  @IsOptional()
  @IsString()
  template?: string;
}
