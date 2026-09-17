import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class UserResponseDto {
  @ApiProperty({ example: '60d5ecb8b394142e88a38c21' })
  id: string;

  @ApiProperty({ example: ' Gourav' })
  firstName: string;

  @ApiProperty({ example: 'Raut' })
  lastName: string;

  @ApiProperty({ example: 'agent@vaultstone.in' })
  email: string;
}

export class SiteVisitResponseDto {
  @ApiProperty({ example: '60d5ecb8b394142e88a38c29' })
  id: string;

  @ApiProperty({ example: 'Avinash Bhute' })
  visitor: string;

  @ApiProperty({ example: 'First Visit' })
  visitType: string;

  @ApiProperty({ example: 'Lead' })
  module: string;

  @ApiProperty({ example: 'Metro City' })
  siteName?: string;

  @ApiProperty({ example: 'Tower A' })
  otherName?: string;

  @ApiProperty({ example: '2026-06-03' })
  visitDate: string;

  @ApiProperty({ example: '11:26 AM' })
  timeIn: string;

  @ApiProperty({ example: '12:10 PM' })
  timeOut: string;

  @ApiProperty({ example: 'Highly interested in booking the penthouse unit.' })
  remark?: string;

  @ApiProperty({ example: 'Gourav Raut' })
  siteManager: string;

  @ApiProperty({ example: 'Sourcing Associate' })
  sourcingManager?: string;

  @ApiProperty({ example: 'Closing Specialist' })
  closingManager?: string;

  @ApiProperty({ example: 'Website Form' })
  source: string;

  @ApiProperty({ example: 'Metro City Branch' })
  branch: string;

  @ApiProperty({ type: UserResponseDto })
  assignee: UserResponseDto;

  @ApiProperty({ example: 'Scheduled' })
  visitStatus: string;

  @ApiProperty({ example: false })
  sendSmsNotification: boolean;

  @ApiProperty({ example: true })
  sendEmailNotification: boolean;

  @ApiProperty({ example: false })
  isPrivate: boolean;

  @ApiPropertyOptional({ example: 'https://cdn.example.com/uploads/photo.jpg' })
  photograph?: string;

  @ApiPropertyOptional({ example: 21.1458 })
  latitude?: number;

  @ApiPropertyOptional({ example: 79.0882 })
  longitude?: number;

  @ApiPropertyOptional({ example: '60d5ecb8b394142e88a38c22' })
  leadId?: string;

  @ApiPropertyOptional({ example: '60d5ecb8b394142e88a38c23' })
  contactId?: string;

  @ApiProperty({ example: '2026-06-03T07:19:43.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-06-03T07:19:43.000Z' })
  updatedAt: Date;
}
