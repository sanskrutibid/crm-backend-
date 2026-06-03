import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class UserResponseDto {
  @ApiProperty({ example: '60d5ecb8b394142e88a38c21' })
  id: string;

  @ApiProperty({ example: 'Gourav' })
  firstName: string;

  @ApiProperty({ example: 'Raut' })
  lastName: string;

  @ApiProperty({ example: 'agent@vaultstone.in' })
  email: string;
}

export class TemplateResponseDto {
  @ApiProperty({ example: '60d5ecb8b394142e88a38c29' })
  id: string;

  @ApiProperty({ example: 'Welcome Onboarding Email' })
  name: string;

  @ApiPropertyOptional({ example: 'welcome_onboarding_01' })
  templateId?: string;

  @ApiProperty({ example: 'Email' })
  templateType: string;

  @ApiProperty({ example: 'editor' })
  layoutType: string;

  @ApiPropertyOptional({ example: '<p>Welcome to our platform!</p>' })
  editorContent?: string;

  @ApiPropertyOptional({ example: 'campaign_template.html' })
  fileName?: string;

  @ApiPropertyOptional({ example: '<html><body>Welcome!</body></html>' })
  fileContent?: string;

  @ApiPropertyOptional({ example: 'https://domain.com/campaign.html' })
  importUrl?: string;

  @ApiPropertyOptional({ type: UserResponseDto })
  createdBy?: UserResponseDto;

  @ApiPropertyOptional({ type: UserResponseDto })
  updatedBy?: UserResponseDto;

  @ApiProperty({ example: '2026-06-03T07:19:43.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-06-03T07:19:43.000Z' })
  updatedAt: Date;
}
