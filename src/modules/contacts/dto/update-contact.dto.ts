import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsBoolean,
  IsOptional,
  IsString,
  IsNumber,
  Min,
  Max,
  IsEmail,
} from 'class-validator';
import {
  DNDStatus,
  EmailStatus,
  ContactVisibility,
} from '../schemas/contact.schema';

export class UpdateContactDto {
  // ==========================================
  // 1. Personal Information (Step 1)
  // ==========================================
  @ApiPropertyOptional({
    example: 'Mrs',
    description: 'Updated Salutation title',
  })
  @IsString()
  @IsOptional()
  salutation?: string;

  @ApiPropertyOptional({
    example: 'Dayamati',
    description: 'Updated Contact first name',
  })
  @IsString()
  @IsOptional()
  firstName?: string;

  @ApiPropertyOptional({
    example: 'Chirawali',
    description: 'Updated Contact last name',
  })
  @IsString()
  @IsOptional()
  lastName?: string;

  @ApiPropertyOptional({
    example: 'Customer',
    description: 'Updated Customer Type classification',
  })
  @IsString()
  @IsOptional()
  customerType?: string;

  @ApiPropertyOptional({
    example: 'Employee',
    description: 'Updated Contact Type classification',
  })
  @IsString()
  @IsOptional()
  contactType?: string;

  @ApiPropertyOptional({
    example: '+91',
    description: 'Updated Country code',
  })
  @IsString()
  @IsOptional()
  countryCode?: string;

  @ApiPropertyOptional({
    example: '9876543210',
    description: 'Updated Primary mobile number',
  })
  @IsString()
  @IsOptional()
  mobile?: string;

  @ApiPropertyOptional({
    example: DNDStatus.DND,
    enum: DNDStatus,
    description: 'Updated DND status registry state',
  })
  @IsEnum(DNDStatus)
  @IsOptional()
  dndStatus?: DNDStatus;

  @ApiPropertyOptional({
    example: '+91 8765432109',
    description: 'Updated alternative contact numbers',
  })
  @IsString()
  @IsOptional()
  otherNumbers?: string;

  @ApiPropertyOptional({
    example: 'dayamati.chirawali@gmail.com',
    description: 'Updated Primary contact email',
  })
  @IsEmail({}, { message: 'Please enter a valid email address' })
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({
    example: EmailStatus.SAFE,
    enum: EmailStatus,
    description: 'Updated Email safety verification status',
  })
  @IsEnum(EmailStatus)
  @IsOptional()
  emailStatus?: EmailStatus;

  @ApiPropertyOptional({
    example: 'GC170426-110807-2165',
    description: 'Updated Unique identification number',
  })
  @IsString()
  @IsOptional()
  uniqueNumber?: string;

  @ApiPropertyOptional({
    example: 'Dhantoli, Nearby Lokmat Building',
    description: 'Updated Address description',
  })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiPropertyOptional({ example: 'Nagpur', description: 'Updated City' })
  @IsString()
  @IsOptional()
  city?: string;

  @ApiPropertyOptional({
    example: 'Dhantoli',
    description: 'Updated Locality region name',
  })
  @IsString()
  @IsOptional()
  locality?: string;

  @ApiPropertyOptional({
    example: '440012',
    description: 'Updated Zip/Postal pin code',
  })
  @IsString()
  @IsOptional()
  pincode?: string;

  // ==========================================
  // 2. Professional Information (Step 2)
  // ==========================================
  @ApiPropertyOptional({
    example: 'Reliance Industries',
    description: 'Updated Company name',
  })
  @IsString()
  @IsOptional()
  companyName?: string;

  @ApiPropertyOptional({
    example: 'IT & Software Solutions',
    description: 'Updated Business domain',
  })
  @IsString()
  @IsOptional()
  businessDomain?: string;

  @ApiPropertyOptional({
    example: 'Private Limited',
    description: 'Updated Company type',
  })
  @IsString()
  @IsOptional()
  companyType?: string;

  @ApiPropertyOptional({
    example: 'Senior Director',
    description: 'Updated Designation title',
  })
  @IsString()
  @IsOptional()
  designation?: string;

  @ApiPropertyOptional({
    example: '₹5 Cr - ₹10 Cr',
    description: 'Updated Investment capacity range',
  })
  @IsString()
  @IsOptional()
  investCapacity?: string;

  @ApiPropertyOptional({
    example: 'State Bank of India',
    description: 'Updated Bank name',
  })
  @IsString()
  @IsOptional()
  bankName?: string;

  @ApiPropertyOptional({
    example: 'Dayamati Chirawali',
    description: 'Updated Bank account name',
  })
  @IsString()
  @IsOptional()
  bankAccountName?: string;

  @ApiPropertyOptional({
    example: '32104598734',
    description: 'Updated Bank Account Number',
  })
  @IsString()
  @IsOptional()
  bankAccountNumber?: string;

  @ApiPropertyOptional({
    example: 'SBIN0001423',
    description: 'Updated Bank IFSC code',
  })
  @IsString()
  @IsOptional()
  ifscCode?: string;

  @ApiPropertyOptional({
    example: 'Corporate Hub whitefield Bangalore',
    description: 'Updated Professional address',
  })
  @IsString()
  @IsOptional()
  professionalAddress?: string;

  @ApiPropertyOptional({
    example: 'Bangalore',
    description: 'Updated Professional City',
  })
  @IsString()
  @IsOptional()
  professionalCity?: string;

  @ApiPropertyOptional({
    example: 'Whitefield',
    description: 'Updated Professional Locality',
  })
  @IsString()
  @IsOptional()
  professionalLocality?: string;

  // ==========================================
  // 3. Other Information (Step 3)
  // ==========================================
  @ApiPropertyOptional({
    example: '1984-06-12',
    description: 'Updated DOB (YYYY-MM-DD)',
  })
  @IsString()
  @IsOptional()
  dob?: string;

  @ApiPropertyOptional({
    example: '2010-11-22',
    description: 'Updated Anniversary Date (YYYY-MM-DD)',
  })
  @IsString()
  @IsOptional()
  anniversary?: string;

  @ApiPropertyOptional({
    example: true,
    description: 'Updated Email greeting opt-in status',
  })
  @IsBoolean()
  @IsOptional()
  sendEmailGreeting?: boolean;

  @ApiPropertyOptional({
    example: true,
    description: 'Updated SMS greeting opt-in status',
  })
  @IsBoolean()
  @IsOptional()
  sendSmsGreeting?: boolean;

  @ApiPropertyOptional({
    example: '022-26593452',
    description: 'Updated Fax number',
  })
  @IsString()
  @IsOptional()
  faxNumber?: string;

  @ApiPropertyOptional({
    example: 'https://vaultstone.com',
    description: 'Updated Website URL',
  })
  @IsString()
  @IsOptional()
  website?: string;

  @ApiPropertyOptional({
    example: 'live:dayamati_skype',
    description: 'Updated Skype username handle',
  })
  @IsString()
  @IsOptional()
  skype?: string;

  @ApiPropertyOptional({
    example: 'English',
    description: 'Updated Preferred contact language',
  })
  @IsString()
  @IsOptional()
  preferredLanguage?: string;

  @ApiPropertyOptional({
    example: 53,
    description: 'Updated priority rating percentage (0-100%)',
  })
  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  rating?: number;

  @ApiPropertyOptional({
    example: 'High intent buyer, looking for flats in Dhantoli.',
    description: 'Updated remarks',
  })
  @IsString()
  @IsOptional()
  customerRemark?: string;

  // ==========================================
  // 4. Save and Publish Settings (Step 4)
  // ==========================================
  @ApiPropertyOptional({
    example: 'Dhantoli, 172Sqft flat 2cr',
    description: 'Updated keywords/tags',
  })
  @IsString()
  @IsOptional()
  keyword?: string;

  @ApiPropertyOptional({
    example: 'Premium Leads Folder',
    description: 'Updated CRM folder category',
  })
  @IsString()
  @IsOptional()
  folder?: string;

  @ApiPropertyOptional({
    example: 'Website Form',
    description: 'Updated Discovery source',
  })
  @IsString()
  @IsOptional()
  source?: string;

  @ApiPropertyOptional({
    example: 'Global Team',
    description: 'Updated Assigned CRM Office branch',
  })
  @IsString()
  @IsOptional()
  branch?: string;

  @ApiPropertyOptional({
    example: '60d5ecb8b394142e88a38c21',
    description: 'Reassign contact to user ID',
  })
  @IsString()
  @IsOptional()
  assignedTo?: string;

  @ApiPropertyOptional({
    example: 'https://cdn.vaultstone.com/profiles/avatar.png',
    description: 'Updated photograph URL path',
  })
  @IsString()
  @IsOptional()
  photograph?: string;

  @ApiPropertyOptional({
    example: ContactVisibility.BRANCH,
    enum: ContactVisibility,
    description: 'Updated visibility settings scope',
  })
  @IsEnum(ContactVisibility)
  @IsOptional()
  visibility?: ContactVisibility;

  @ApiPropertyOptional({
    example: false,
    description: 'Toggle number confidentiality parameter',
  })
  @IsBoolean()
  @IsOptional()
  isConfidential?: boolean;

  @ApiPropertyOptional({
    example: true,
    description: 'Toggle promotion marketing subscription',
  })
  @IsBoolean()
  @IsOptional()
  subscribePromotions?: boolean;
}
