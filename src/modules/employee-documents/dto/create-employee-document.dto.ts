import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateEmployeeDocumentDto {
  @ApiProperty({ description: 'Employee ID' })
  @IsString()
  @IsNotEmpty()
  employeeId: string;

  @ApiProperty({ description: 'Employee Name' })
  @IsString()
  @IsNotEmpty()
  employeeName: string;

  @ApiPropertyOptional({ description: 'Department' })
  @IsString()
  @IsOptional()
  department?: string;

  @ApiProperty({ description: 'Document Type e.g., Aadhaar Card, PAN Card' })
  @IsString()
  @IsNotEmpty()
  documentType: string;

  @ApiProperty({ description: 'Document Number' })
  @IsString()
  @IsNotEmpty()
  documentNumber: string;

  @ApiPropertyOptional({ description: 'Issue Date' })
  @IsString()
  @IsOptional()
  issueDate?: string;

  @ApiPropertyOptional({ description: 'Expiry Date' })
  @IsString()
  @IsOptional()
  expiryDate?: string;

  @ApiPropertyOptional({ description: 'Front Side File / Image (URL or Base64)' })
  @IsString()
  @IsOptional()
  frontFile?: string;

  @ApiPropertyOptional({ description: 'Back Side File / Image (URL or Base64)' })
  @IsString()
  @IsOptional()
  backFile?: string;

  @ApiPropertyOptional({ description: 'Verification Remarks' })
  @IsString()
  @IsOptional()
  remarks?: string;

  @ApiPropertyOptional({ description: 'Upload Date' })
  @IsString()
  @IsOptional()
  uploadDate?: string;

  @ApiPropertyOptional({ description: 'Status e.g., Verified, Pending, Expired' })
  @IsString()
  @IsOptional()
  status?: string;
}
