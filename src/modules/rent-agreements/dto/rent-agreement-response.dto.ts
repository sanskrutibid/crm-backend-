import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RentAgreementResponseDto {
  @ApiProperty({
    example: '60d5ed7ab394142e88a38c29',
    description: 'Rent Agreement unique database identifier ID',
  })
  id: string;

  @ApiProperty({ description: 'Tenant/Licensee contact details' })
  tenant: any;

  @ApiPropertyOptional({ example: 'Jane Doe', description: 'In the name of' })
  inNameOf?: string;

  @ApiProperty({ description: 'Property details' })
  property: any;

  @ApiPropertyOptional({ example: '2026-06-03', description: 'Agreement Date' })
  agreementDate?: string;

  @ApiPropertyOptional({
    example: '2027-06-03',
    description: 'Agreement Expiration Date (Valid To)',
  })
  validTo?: string;

  @ApiPropertyOptional({ example: 'CR987654321', description: 'CR Number' })
  crNumber?: string;

  @ApiPropertyOptional({ example: 25000, description: 'Rent per Month in INR' })
  rentPerMonth?: number;

  @ApiPropertyOptional({
    example: 75000,
    description: 'Security Deposit amount in INR',
  })
  securityDeposit?: number;

  @ApiPropertyOptional({ example: 10000, description: 'Registration Cost' })
  registrationCost?: number;

  @ApiPropertyOptional({
    example: 12500,
    description: 'Brokerage paid by Licensor/Landlord',
  })
  brokerageLicensor?: number;

  @ApiPropertyOptional({
    example: 12500,
    description: 'Brokerage paid by Licensee/Tenant',
  })
  brokerageLicensee?: number;

  @ApiPropertyOptional({
    example: 25000,
    description: 'Total Brokerage amount',
  })
  brokerageTotal?: number;

  @ApiPropertyOptional({ example: 3500, description: 'Documentation Charges' })
  documentationCharges?: number;

  @ApiPropertyOptional({ example: 15000, description: 'Stamp Duty' })
  stampDuty?: number;

  @ApiPropertyOptional({ example: 2500, description: 'Other Expenses' })
  otherExpense?: number;

  @ApiPropertyOptional({
    example: 10000,
    description: 'Furniture and Fixtures value',
  })
  furnitureAndFixtures?: number;

  @ApiPropertyOptional({
    example: 'Shared Equally',
    description: 'Who pays legal charges',
  })
  legalChargesPaidBy?: string;

  @ApiPropertyOptional({
    example: 5,
    description: 'Day of the month for rent reminders (e.g. 5th)',
  })
  rentReminderDay?: number;

  @ApiPropertyOptional({
    example: 'Terms and conditions text...',
    description: 'Terms and Conditions',
  })
  termsAndConditions?: string;

  @ApiPropertyOptional({
    example: false,
    description: 'Send lease expiry alert to Landlord/Owner',
  })
  sendLeaseExpiryAlertToOwner?: boolean;

  @ApiPropertyOptional({
    example: false,
    description: 'Send lease expiry alert to Tenant',
  })
  sendLeaseExpiryAlertToTenant?: boolean;

  @ApiPropertyOptional({
    example: false,
    description: 'Send SMS rent reminder to Tenant',
  })
  sendSmsRentReminderToTenant?: boolean;

  @ApiPropertyOptional({
    example: 'Tower A',
    description: 'Denormalized building name',
  })
  building?: string;

  @ApiPropertyOptional({ description: 'User who created the agreement' })
  createdBy?: any;

  @ApiPropertyOptional({ description: 'Assigned User details' })
  assignedTo?: any;

  @ApiProperty({
    example: '2026-06-03T12:00:00.000Z',
    description: 'Create Date',
  })
  createdAt: string;

  @ApiProperty({
    example: '2026-06-03T12:00:00.000Z',
    description: 'Update Date',
  })
  updatedAt: string;
}
