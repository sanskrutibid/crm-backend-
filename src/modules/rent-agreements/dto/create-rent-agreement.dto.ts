import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsNumber,
  Min,
  IsBoolean,
} from 'class-validator';

export class CreateRentAgreementDto {
  @ApiProperty({
    example: '60d5ecb8b394142e88a38c21',
    description: 'Database ID of the Contact representing the tenant/licensee',
  })
  @IsString()
  @IsNotEmpty({ message: 'Tenant ID is required' })
  tenant: string;

  @ApiPropertyOptional({
    example: 'Jane Doe',
    description: 'In the name of',
  })
  @IsString()
  @IsOptional()
  inNameOf?: string;

  @ApiProperty({
    example: '60d5ecb8b394142e88a38c22',
    description: 'Database ID of the Property',
  })
  @IsString()
  @IsNotEmpty({ message: 'Property ID is required' })
  property: string;

  @ApiPropertyOptional({
    example: '2026-06-03',
    description: 'Agreement Date',
  })
  @IsString()
  @IsOptional()
  agreementDate?: string;

  @ApiPropertyOptional({
    example: '2027-06-03',
    description: 'Agreement Expiration Date (Valid To)',
  })
  @IsString()
  @IsOptional()
  validTo?: string;

  @ApiPropertyOptional({
    example: 'CR987654321',
    description: 'CR Number',
  })
  @IsString()
  @IsOptional()
  crNumber?: string;

  @ApiPropertyOptional({ example: 25000, description: 'Rent per Month in INR' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  rentPerMonth?: number;

  @ApiPropertyOptional({
    example: 75000,
    description: 'Security Deposit amount in INR',
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  securityDeposit?: number;

  @ApiPropertyOptional({ example: 10000, description: 'Registration Cost' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  registrationCost?: number;

  @ApiPropertyOptional({
    example: 12500,
    description: 'Brokerage paid by Licensor/Landlord',
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  brokerageLicensor?: number;

  @ApiPropertyOptional({
    example: 12500,
    description: 'Brokerage paid by Licensee/Tenant',
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  brokerageLicensee?: number;

  @ApiPropertyOptional({
    example: 25000,
    description: 'Total Brokerage amount',
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  brokerageTotal?: number;

  @ApiPropertyOptional({ example: 3500, description: 'Documentation Charges' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  documentationCharges?: number;

  @ApiPropertyOptional({ example: 15000, description: 'Stamp Duty' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  stampDuty?: number;

  @ApiPropertyOptional({ example: 2500, description: 'Other Expenses' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  otherExpense?: number;

  @ApiPropertyOptional({
    example: 10000,
    description: 'Furniture and Fixtures value',
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  furnitureAndFixtures?: number;

  @ApiPropertyOptional({
    example: 'Shared Equally',
    description: 'Who pays legal charges',
  })
  @IsString()
  @IsOptional()
  legalChargesPaidBy?: string;

  @ApiPropertyOptional({
    example: 5,
    description: 'Day of the month for rent reminders (e.g. 5th)',
  })
  @IsNumber()
  @Min(1)
  @IsOptional()
  rentReminderDay?: number;

  @ApiPropertyOptional({
    example: 'Terms and conditions for rent agreement...',
    description: 'Terms and Conditions text',
  })
  @IsString()
  @IsOptional()
  termsAndConditions?: string;

  @ApiPropertyOptional({
    example: false,
    description: 'Send lease expiry alert to Landlord/Owner',
  })
  @IsBoolean()
  @IsOptional()
  sendLeaseExpiryAlertToOwner?: boolean;

  @ApiPropertyOptional({
    example: false,
    description: 'Send lease expiry alert to Tenant',
  })
  @IsBoolean()
  @IsOptional()
  sendLeaseExpiryAlertToTenant?: boolean;

  @ApiPropertyOptional({
    example: false,
    description: 'Send SMS rent reminder to Tenant',
  })
  @IsBoolean()
  @IsOptional()
  sendSmsRentReminderToTenant?: boolean;

  @ApiPropertyOptional({
    example: '60d5ecb8b394142e88a38c20',
    description: 'User ID of assigned manager/agent',
  })
  @IsString()
  @IsOptional()
  assignedTo?: string;
}
