import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SaleAgreementResponseDto {
  @ApiProperty({
    example: '60d5ed7ab394142e88a38c29',
    description: 'Sale Agreement unique database identifier ID',
  })
  id: string;

  @ApiProperty({ description: 'Buyer/Licensee contact details' })
  buyer: any;

  @ApiPropertyOptional({
    example: 'John Doe & Co',
    description: 'In the name of',
  })
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

  @ApiPropertyOptional({ example: 'CR12345678', description: 'CR Number' })
  crNumber?: string;

  @ApiPropertyOptional({
    example: 5000000,
    description: 'Agreement Value in INR',
  })
  agreementValue?: number;

  @ApiPropertyOptional({
    example: 12000,
    description: 'Advance Maintenance Charges',
  })
  advanceMaintenance?: number;

  @ApiPropertyOptional({
    example: 4500000,
    description: "Buyer's Contribution",
  })
  buyersContribution?: number;

  @ApiPropertyOptional({
    example: 50000,
    description: 'Brokerage paid by Buyer',
  })
  brokerageBuyer?: number;

  @ApiPropertyOptional({
    example: 50000,
    description: 'Brokerage paid by Seller',
  })
  brokerageSeller?: number;

  @ApiPropertyOptional({
    example: 100000,
    description: 'Total Brokerage amount',
  })
  brokerageTotal?: number;

  @ApiPropertyOptional({ example: 250000, description: 'Parking charges' })
  parkingCharges?: number;

  @ApiPropertyOptional({ example: 3500000, description: 'Loan Amount' })
  loanAmount?: number;

  @ApiPropertyOptional({
    example: 'NOC Transfer',
    description: 'Transfer type',
  })
  transferType?: string;

  @ApiPropertyOptional({ example: 15000, description: 'Transfer charges' })
  transferCharges?: number;

  @ApiPropertyOptional({ example: 20000, description: 'Development charges' })
  developmentCharges?: number;

  @ApiPropertyOptional({ example: 30000, description: 'Registration Cost' })
  registrationCost?: number;

  @ApiPropertyOptional({ example: 5000, description: 'Documentation Charges' })
  documentationCharges?: number;

  @ApiPropertyOptional({ example: 150000, description: 'Stamp Duty' })
  stampDuty?: number;

  @ApiPropertyOptional({
    example: 75000,
    description: 'Furniture and Fixtures value',
  })
  furnitureAndFixtures?: number;

  @ApiPropertyOptional({ example: 3500, description: 'Other Expenses' })
  otherExpense?: number;

  @ApiPropertyOptional({ example: 5, description: 'VAT percentage' })
  vatPercent?: number;

  @ApiPropertyOptional({
    example: 8.5,
    description: 'Interest Rate percentage',
  })
  interestRatePercent?: number;

  @ApiPropertyOptional({ example: 18, description: 'GST percentage' })
  gstPercent?: number;

  @ApiPropertyOptional({
    example: 'Terms and conditions text...',
    description: 'Terms and Conditions',
  })
  termsAndConditions?: string;

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
