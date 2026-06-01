import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
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

export class CreateContactDto {
  // ==========================================
  // 1. Personal Information (Step 1)
  // ==========================================
  @ApiPropertyOptional({ example: 'Mrs', description: 'Salutation title' })
  @IsString()
  @IsOptional()
  salutation?: string;

  @ApiProperty({ example: 'Dayamati', description: 'Contact first name' })
  @IsString()
  @IsNotEmpty({ message: 'First name is required' })
  firstName: string;

  @ApiPropertyOptional({
    example: 'Chirawali',
    description: 'Contact last name',
  })
  @IsString()
  @IsOptional()
  lastName?: string;

  @ApiProperty({
    example: 'Customer',
    description:
      'Customer Type classification (Customer, Landlord, Shared, Broker)',
  })
  @IsString()
  @IsNotEmpty({ message: 'Customer Type is required' })
  customerType: string;

  @ApiProperty({
    example: 'Employee',
    description: 'Contact Type classification (Employee, Broker)',
  })
  @IsString()
  @IsNotEmpty({ message: 'Contact Type is required' })
  contactType: string;

  @ApiProperty({
    example: '+91 9876543210',
    description: 'Primary mobile number including country code',
  })
  @IsString()
  @IsNotEmpty({ message: 'Mobile number is required' })
  mobile: string;

  @ApiPropertyOptional({
    example: DNDStatus.PENDING,
    enum: DNDStatus,
    description: 'DND registry registration status',
    default: DNDStatus.PENDING,
  })
  @IsEnum(DNDStatus)
  @IsOptional()
  dndStatus?: DNDStatus;

  @ApiPropertyOptional({
    example: '+91 8765432109',
    description: 'Secondary/alternative contact numbers',
  })
  @IsString()
  @IsOptional()
  otherNumbers?: string;

  @ApiPropertyOptional({
    example: 'dayamati@gmail.com',
    description: 'Primary contact email',
  })
  @IsEmail({}, { message: 'Please enter a valid email address' })
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({
    example: EmailStatus.PENDING,
    enum: EmailStatus,
    description: 'Email security safe-to-send status',
    default: EmailStatus.PENDING,
  })
  @IsEnum(EmailStatus)
  @IsOptional()
  emailStatus?: EmailStatus;

  @ApiPropertyOptional({
    example: 'GC170426-110807-2165',
    description: 'Unique identification registration number',
  })
  @IsString()
  @IsOptional()
  uniqueNumber?: string;

  @ApiPropertyOptional({
    example: 'Dhantoli, Nearby Lokmat Building',
    description: 'Geographical primary address',
  })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiPropertyOptional({ example: 'Nagpur', description: 'City name' })
  @IsString()
  @IsOptional()
  city?: string;

  @ApiPropertyOptional({
    example: 'Dhantoli',
    description: 'Locality region name',
  })
  @IsString()
  @IsOptional()
  locality?: string;

  @ApiPropertyOptional({
    example: '440012',
    description: 'Zip/Postal pin code',
  })
  @IsString()
  @IsOptional()
  pincode?: string;

  // ==========================================
  // 2. Professional Information (Step 2)
  // ==========================================
  @ApiPropertyOptional({
    example: 'Reliance Industries',
    description: 'Company employment name',
  })
  @IsString()
  @IsOptional()
  companyName?: string;

  @ApiPropertyOptional({
    example: 'IT & Software Solutions',
    description: 'Business vertical/domain category',
  })
  @IsString()
  @IsOptional()
  businessDomain?: string;

  @ApiPropertyOptional({
    example: 'Private Limited',
    description: 'Company incorporation type',
  })
  @IsString()
  @IsOptional()
  companyType?: string;

  @ApiPropertyOptional({
    example: 'Senior Director',
    description: 'Professional designation title',
  })
  @IsString()
  @IsOptional()
  designation?: string;

  @ApiPropertyOptional({
    example: '₹5 Cr - ₹10 Cr',
    description: 'Investment capacity estimation range',
  })
  @IsString()
  @IsOptional()
  investCapacity?: string;

  @ApiPropertyOptional({
    example: 'State Bank of India',
    description: 'Bank institution name',
  })
  @IsString()
  @IsOptional()
  bankName?: string;

  @ApiPropertyOptional({
    example: 'Dayamati Chirawali',
    description: 'Bank account holder name',
  })
  @IsString()
  @IsOptional()
  bankAccountName?: string;

  @ApiPropertyOptional({
    example: '32104598734',
    description: 'Bank Account Number',
  })
  @IsString()
  @IsOptional()
  bankAccountNumber?: string;

  @ApiPropertyOptional({
    example: 'SBIN0001423',
    description: 'Bank branch IFSC code',
  })
  @IsString()
  @IsOptional()
  ifscCode?: string;

  @ApiPropertyOptional({
    example: 'Corporate Hub whitefield Bangalore',
    description: 'Professional address',
  })
  @IsString()
  @IsOptional()
  professionalAddress?: string;

  @ApiPropertyOptional({
    example: 'Bangalore',
    description: 'Professional office city',
  })
  @IsString()
  @IsOptional()
  professionalCity?: string;

  @ApiPropertyOptional({
    example: 'Whitefield',
    description: 'Professional office locality',
  })
  @IsString()
  @IsOptional()
  professionalLocality?: string;

  // ==========================================
  // 3. Other Information (Step 3)
  // ==========================================
  @ApiPropertyOptional({
    example: '1984-06-12',
    description: 'Date of Birth (YYYY-MM-DD)',
  })
  @IsString()
  @IsOptional()
  dob?: string;

  @ApiPropertyOptional({
    example: '2010-11-22',
    description: 'Anniversary Date (YYYY-MM-DD)',
  })
  @IsString()
  @IsOptional()
  anniversary?: string;

  @ApiPropertyOptional({
    example: true,
    description: 'Toggle automatic birthday greetings',
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  sendEmailGreeting?: boolean;

  @ApiPropertyOptional({
    example: true,
    description: 'Toggle automatic SMS greetings',
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  sendSmsGreeting?: boolean;

  @ApiPropertyOptional({
    example: '022-26593452',
    description: 'Office fax number',
  })
  @IsString()
  @IsOptional()
  faxNumber?: string;

  @ApiPropertyOptional({
    example: 'https://b2bbricks.com',
    description: 'Personal or business website URL',
  })
  @IsString()
  @IsOptional()
  website?: string;

  @ApiPropertyOptional({
    example: 'live:dayamati_skype',
    description: 'Skype username handle',
  })
  @IsString()
  @IsOptional()
  skype?: string;

  @ApiPropertyOptional({
    example: 'English',
    description: 'Preferred contact language',
    default: 'English',
  })
  @IsString()
  @IsOptional()
  preferredLanguage?: string;

  @ApiPropertyOptional({
    example: 4.5,
    description: 'Customer priority rating ratio',
    default: 1.0,
  })
  @IsNumber()
  @Min(1.0)
  @Max(5.0)
  @IsOptional()
  rating?: number;

  @ApiPropertyOptional({
    example: 'High intent buyer, looking for immediate flats in Dhantoli.',
    description: 'Agent remarks',
  })
  @IsString()
  @IsOptional()
  customerRemark?: string;

  // ==========================================
  // 4. Save and Publish Settings (Step 4)
  // ==========================================
  @ApiPropertyOptional({
    example: 'Dhantoli, 172Sqft flat 2cr',
    description: 'Tags/Keywords related to customer interest',
  })
  @IsString()
  @IsOptional()
  keyword?: string;

  @ApiPropertyOptional({
    example: 'Premium Leads Folder',
    description: 'Target CRM storage folder name',
  })
  @IsString()
  @IsOptional()
  folder?: string;

  @ApiProperty({
    example: 'Website Form',
    description: 'Lead discovery channel source',
  })
  @IsString()
  @IsNotEmpty({ message: 'Source channel is required' })
  source: string;

  @ApiProperty({
    example: 'Global Team',
    description: 'Assigned CRM office branch location name',
  })
  @IsString()
  @IsNotEmpty({ message: 'Office branch is required' })
  branch: string;

  @ApiPropertyOptional({
    example: '60d5ecb8b394142e88a38c21',
    description:
      'Assigned user database ID. If empty, falls back to requesting user.',
  })
  @IsString()
  @IsOptional()
  assignedTo?: string;

  @ApiPropertyOptional({
    example: 'https://cdn.b2bbricks.com/profiles/avatar.png',
    description: 'Upload path URL for customer portrait',
  })
  @IsString()
  @IsOptional()
  photograph?: string;

  @ApiPropertyOptional({
    example: ContactVisibility.PRIVATE,
    enum: ContactVisibility,
    description: 'Visibility scope permissions',
    default: ContactVisibility.PRIVATE,
  })
  @IsEnum(ContactVisibility)
  @IsOptional()
  visibility?: ContactVisibility;

  @ApiPropertyOptional({
    example: false,
    description: 'Marks phone number confidential',
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  isConfidential?: boolean;

  @ApiPropertyOptional({
    example: true,
    description: 'Opt-in for marketing emails & sms campaigns',
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  subscribePromotions?: boolean;
}
