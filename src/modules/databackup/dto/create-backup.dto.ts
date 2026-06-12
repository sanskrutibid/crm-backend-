import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString, IsNotEmpty } from 'class-validator';

export class CreateBackupDto {
  @ApiProperty({
    example: 'CONTACT',
    enum: ['CONTACT', 'LEAD', 'ENQUIRY', 'PROPERTY', 'PROJECT', 'SITEVISIT'],
    description: 'The module/collection to backup',
  })
  @IsEnum(['CONTACT', 'LEAD', 'ENQUIRY', 'PROPERTY', 'PROJECT', 'SITEVISIT'], {
    message:
      'Module must be one of: CONTACT, LEAD, ENQUIRY, PROPERTY, PROJECT, SITEVISIT',
  })
  @IsString()
  @IsNotEmpty()
  module: string;
}
