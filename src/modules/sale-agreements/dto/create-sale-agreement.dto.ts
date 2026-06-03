import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsNumber,
  Min,
} from 'class-validator';

export class CreateSaleAgreementDto {
  @ApiProperty({
    example: '60d5ecb8b394142e88a38c21',
    description: 'Database ID of the Contact representing the buyer/licensee',
  })
  @IsString()
  @IsNotEmpty({ message: 'Buyer ID is required' })
  buyer: string;

  @ApiPropertyOptional({
    example: 'John Doe & Co',
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
    example: 'CR12345678',
    description: 'CR Number',
  })
  @IsString()
  @IsOptional()
  crNumber?: string;

  @ApiPropertyOptional({
    example: 5000000,
    description: 'Agreement Value in INR',
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  agreementValue?: number;

  @ApiPropertyOptional({ example: 12000, description: 'Advance Maintenance Charges' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  advanceMaintenance?: number;

  @ApiPropertyOptional({ example: 4500000, description: 'Buyer\'s Contribution' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  buyersContribution?: number;

  @ApiPropertyOptional({ example: 50000, description: 'Brokerage paid by Buyer' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  brokerageBuyer?: number;

  @ApiPropertyOptional({ example: 50000, description: 'Brokerage paid by Seller' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  brokerageSeller?: number;

  @ApiPropertyOptional({ example: 100000, description: 'Total Brokerage amount' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  brokerageTotal?: number;

  @ApiPropertyOptional({ example: 250000, description: 'Parking charges' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  parkingCharges?: number;

  @ApiPropertyOptional({ example: 3500000, description: 'Loan Amount' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  loanAmount?: number;

  @ApiPropertyOptional({ example: 'NOC Transfer', description: 'Transfer type' })
  @IsString()
  @IsOptional()
  transferType?: string;

  @ApiPropertyOptional({ example: 15000, description: 'Transfer charges' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  transferCharges?: number;

  @ApiPropertyOptional({ example: 20000, description: 'Development charges' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  developmentCharges?: number;

  @ApiPropertyOptional({ example: 30000, description: 'Registration Cost' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  registrationCost?: number;

  @ApiPropertyOptional({ example: 5000, description: 'Documentation Charges' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  documentationCharges?: number;

  @ApiPropertyOptional({ example: 150000, description: 'Stamp Duty' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  stampDuty?: number;

  @ApiPropertyOptional({ example: 75000, description: 'Furniture and Fixtures value' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  furnitureAndFixtures?: number;

  @ApiPropertyOptional({ example: 3500, description: 'Other Expenses' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  otherExpense?: number;

  @ApiPropertyOptional({ example: 5, description: 'VAT percentage' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  vatPercent?: number;

  @ApiPropertyOptional({ example: 8.5, description: 'Interest Rate percentage' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  interestRatePercent?: number;

  @ApiPropertyOptional({ example: 18, description: 'GST percentage' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  gstPercent?: number;

  @ApiPropertyOptional({
    example: 'Terms and conditions for sale agreement...',
    description: 'Terms and Conditions text',
  })
  @IsString()
  @IsOptional()
  termsAndConditions?: string;

  @ApiPropertyOptional({
    example: '60d5ecb8b394142e88a38c20',
    description: 'User ID of assigned manager/agent',
  })
  @IsString()
  @IsOptional()
  assignedTo?: string;
}
