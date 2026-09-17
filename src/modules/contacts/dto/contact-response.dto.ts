import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  DNDStatus,
  EmailStatus,
  ContactVisibility,
} from '../schemas/contact.schema';
import { AuthUserDto } from '../../auth/dto/auth-response.dto';

export class ContactResponseDto {
  @ApiProperty({
    example: '60d5ed7ab394142e88a38c29',
    description: 'Contact unique database ID',
  })
  id: string;

  // ==========================================
  // 1. Personal Information (Step 1)
  // ==========================================
  @ApiPropertyOptional({ example: 'Mrs', description: 'Salutation title' })
  salutation?: string;

  @ApiProperty({ example: 'Dayamati', description: 'Contact first name' })
  firstName: string;

  @ApiPropertyOptional({
    example: 'Chirawali',
    description: 'Contact last name',
  })
  lastName?: string;

  @ApiProperty({
    example: 'Customer',
    description: 'Customer type classification',
  })
  customerType: string;

  @ApiProperty({
    example: 'Employee',
    description: 'Contact type classification',
  })
  contactType: string;

  @ApiProperty({
    example: '+91 9876543210',
    description: 'Primary contact phone',
  })
  mobile: string;

  @ApiProperty({
    example: 'Pending',
    enum: DNDStatus,
    description: 'DND registry registration status',
  })
  dndStatus: DNDStatus;

  @ApiPropertyOptional({
    example: '+91 8765432109',
    description: 'Alternative contact phone numbers',
  })
  otherNumbers?: string;

  @ApiPropertyOptional({
    example: 'dayamati@gmail.com',
    description: 'Primary contact email',
  })
  email?: string;

  @ApiProperty({
    example: 'Pending',
    enum: EmailStatus,
    description: 'Email security verification status',
  })
  emailStatus: EmailStatus;

  @ApiPropertyOptional({
    example: 'GC170426-110807-2165',
    description: 'Unique identification registration number',
  })
  uniqueNumber?: string;

  @ApiPropertyOptional({
    example: 'Dhantoli, Nearby Lokmat Building',
    description: 'Geographical primary address',
  })
  address?: string;

  @ApiPropertyOptional({ example: 'Nagpur', description: 'City name' })
  city?: string;

  @ApiPropertyOptional({
    example: 'Dhantoli',
    description: 'Locality region name',
  })
  locality?: string;

  @ApiPropertyOptional({
    example: '440012',
    description: 'Zip/Postal pin code',
  })
  pincode?: string;

  // ==========================================
  // 2. Professional Information (Step 2)
  // ==========================================
  @ApiPropertyOptional({
    example: 'Reliance Industries',
    description: 'Company employment name',
  })
  companyName?: string;

  @ApiPropertyOptional({
    example: 'IT & Software Solutions',
    description: 'Business vertical/domain category',
  })
  businessDomain?: string;

  @ApiPropertyOptional({
    example: 'Private Limited',
    description: 'Company incorporation type',
  })
  companyType?: string;

  @ApiPropertyOptional({
    example: 'Senior Director',
    description: 'Professional designation title',
  })
  designation?: string;

  @ApiPropertyOptional({
    example: '₹5 Cr - ₹10 Cr',
    description: 'Investment capacity estimation range',
  })
  investCapacity?: string;

  @ApiPropertyOptional({
    example: 'State Bank of India',
    description: 'Bank institution name',
  })
  bankName?: string;

  @ApiPropertyOptional({
    example: 'Dayamati Chirawali',
    description: 'Bank account holder name',
  })
  bankAccountName?: string;

  @ApiPropertyOptional({
    example: '32104598734',
    description: 'Bank account number value',
  })
  bankAccountNumber?: string;

  @ApiPropertyOptional({
    example: 'SBIN0001423',
    description: 'Bank branch IFSC code',
  })
  ifscCode?: string;

  @ApiPropertyOptional({
    example: 'Corporate Hub whitefield Bangalore',
    description: 'Professional address',
  })
  professionalAddress?: string;

  @ApiPropertyOptional({
    example: 'Bangalore',
    description: 'Professional office city',
  })
  professionalCity?: string;

  @ApiPropertyOptional({
    example: 'Whitefield',
    description: 'Professional office locality',
  })
  professionalLocality?: string;

  // ==========================================
  // 3. Other Information (Step 3)
  // ==========================================
  @ApiPropertyOptional({
    example: '1984-06-12',
    description: 'Date of Birth (YYYY-MM-DD)',
  })
  dob?: string;

  @ApiPropertyOptional({
    example: '2010-11-22',
    description: 'Anniversary Date (YYYY-MM-DD)',
  })
  anniversary?: string;

  @ApiProperty({
    example: true,
    description: 'Toggle automatic birthday greetings',
  })
  sendEmailGreeting: boolean;

  @ApiProperty({ example: true, description: 'Toggle automatic SMS greetings' })
  sendSmsGreeting: boolean;

  @ApiPropertyOptional({
    example: '022-26593452',
    description: 'Office fax number',
  })
  faxNumber?: string;

  @ApiPropertyOptional({
    example: 'https://vaultstone.com',
    description: 'Personal or business website URL',
  })
  website?: string;

  @ApiPropertyOptional({
    example: 'live:dayamati_skype',
    description: 'Skype username handle',
  })
  skype?: string;

  @ApiPropertyOptional({
    example: 'English',
    description: 'Preferred contact language',
  })
  preferredLanguage?: string;

  @ApiPropertyOptional({
    example: 4.5,
    description: 'Customer priority rating ratio',
  })
  rating?: number;

  @ApiPropertyOptional({
    example: 'High intent buyer, looking for immediate flats in Dhantoli.',
    description: 'Agent remarks',
  })
  customerRemark?: string;

  // ==========================================
  // 4. Save and Publish Settings (Step 4)
  // ==========================================
  @ApiPropertyOptional({
    example: 'Dhantoli, 172Sqft flat 2cr',
    description: 'Tags/Keywords related to customer interest',
  })
  keyword?: string;

  @ApiPropertyOptional({
    example: 'Premium Leads Folder',
    description: 'Target CRM storage folder name',
  })
  folder?: string;

  @ApiProperty({
    example: 'Website Form',
    description: 'Lead discovery channel source',
  })
  source: string;

  @ApiProperty({
    example: 'Global Team',
    description: 'Assigned CRM office branch location name',
  })
  branch: string;

  @ApiProperty({
    description: 'CRM agent assigned to this contact',
    type: AuthUserDto,
  })
  assignedTo: AuthUserDto;

  @ApiPropertyOptional({
    example: 'https://cdn.vaultstone.com/profiles/avatar.png',
    description: 'Upload path URL for customer portrait',
  })
  photograph?: string;

  @ApiProperty({
    example: 'Private',
    enum: ContactVisibility,
    description: 'Visibility scope permissions',
  })
  visibility: ContactVisibility;

  @ApiProperty({
    example: false,
    description: 'Marks phone number confidential',
  })
  isConfidential: boolean;

  @ApiProperty({
    example: true,
    description: 'Opt-in for marketing emails & sms campaigns',
  })
  subscribePromotions: boolean;

  // ==========================================
  // Timestamps / Audit Traces (Screenshot 6)
  // ==========================================
  @ApiProperty({
    example: '2026-05-26T14:04:03.000Z',
    description: 'Timestamp of contact registration',
  })
  createdAt: string;

  @ApiProperty({
    example: '2026-05-26T14:04:03.000Z',
    description: 'Timestamp of last modification',
  })
  updatedAt: string;
}
