import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateTemplateDto {
  @ApiProperty({
    example: 'Welcome Onboarding Email',
    description: 'Template Name / Subject',
  })
  @IsString()
  @IsNotEmpty({ message: 'Template Name is required' })
  name: string;

  @ApiPropertyOptional({
    example: 'welcome_onboarding_01',
    description: 'Template ID / Identifier name for messaging engines',
  })
  @IsString()
  @IsOptional()
  templateId?: string;

  @ApiProperty({
    example: 'Email',
    description: 'Template Type (e.g. Email, SMS, WhatsApp)',
  })
  @IsString()
  @IsNotEmpty({ message: 'Template Type is required' })
  templateType: string;

  @ApiProperty({
    example: 'editor',
    description: 'Content layout type (editor, file, url)',
    default: 'editor',
  })
  @IsString()
  @IsNotEmpty({ message: 'Layout Type is required' })
  layoutType: string;

  @ApiPropertyOptional({
    example: '<p>Welcome to our platform!</p>',
    description: 'Rich text content / editor content HTML',
  })
  @IsString()
  @IsOptional()
  editorContent?: string;

  @ApiPropertyOptional({
    example: 'campaign_template.html',
    description: 'Original file name uploaded',
  })
  @IsString()
  @IsOptional()
  fileName?: string;

  @ApiPropertyOptional({
    example: '<html><body>Welcome!</body></html>',
    description: 'Uploaded HTML campaign file content',
  })
  @IsString()
  @IsOptional()
  fileContent?: string;

  @ApiPropertyOptional({
    example: 'https://domain.com/campaign.html',
    description: 'Hosted URL import path for template HTML',
  })
  @IsString()
  @IsOptional()
  importUrl?: string;

  @ApiPropertyOptional({
    example: '60d5ecb8b394142e88a38c21',
    description: 'User MongoDB ID of creator',
  })
  @IsString()
  @IsOptional()
  createdBy?: string;
}
