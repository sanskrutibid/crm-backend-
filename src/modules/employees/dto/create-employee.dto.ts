import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsEmail,
  IsDateString,
  IsEnum,
} from 'class-validator';

export class CreateEmployeeDto {
  @ApiPropertyOptional({ example: 'EMP001', description: 'Unique Employee ID' })
  @IsOptional()
  @IsString()
  employeeId?: string;

  @ApiProperty({ example: 'Rahul', description: 'First Name' })
  @IsNotEmpty({ message: 'First name is required' })
  @IsString()
  firstName: string;

  @ApiPropertyOptional({ example: 'Kumar', description: 'Middle Name' })
  @IsOptional()
  @IsString()
  middleName?: string;

  @ApiProperty({ example: 'Sharma', description: 'Last Name' })
  @IsNotEmpty({ message: 'Last name is required' })
  @IsString()
  lastName: string;

  @ApiProperty({ example: 'Male', description: 'Gender' })
  @IsNotEmpty({ message: 'Gender is required' })
  @IsString()
  gender: string;

  @ApiProperty({ example: '1998-06-20', description: 'Date of Birth (YYYY-MM-DD)' })
  @IsNotEmpty({ message: 'Date of Birth is required' })
  @IsDateString({}, { message: 'Invalid Date of Birth' })
  dob: string;

  @ApiPropertyOptional({ example: 'B+', description: 'Blood Group' })
  @IsOptional()
  @IsString()
  bloodGroup?: string;

  @ApiPropertyOptional({ example: 'Single', description: 'Marital Status' })
  @IsOptional()
  @IsString()
  maritalStatus?: string;

  @ApiPropertyOptional({ example: 'Indian', default: 'Indian', description: 'Nationality' })
  @IsOptional()
  @IsString()
  nationality?: string;

  // Contact Info
  @ApiProperty({ example: '9876543210', description: '10 digit mobile number' })
  @IsNotEmpty({ message: 'Mobile number is required' })
  @IsString()
  mobile: string;

  @ApiPropertyOptional({ example: '9876543211', description: 'Alternate mobile number' })
  @IsOptional()
  @IsString()
  alternateMobile?: string;

  @ApiProperty({ example: 'rahul@test.com', description: 'Personal Email' })
  @IsNotEmpty({ message: 'Personal email is required' })
  @IsEmail({}, { message: 'Invalid email address' })
  personalEmail: string;

  @ApiPropertyOptional({ example: 'rahul@company.com', description: 'Official Email' })
  @IsOptional()
  @IsEmail({}, { message: 'Invalid official email address' })
  officialEmail?: string;

  @ApiPropertyOptional({ example: 'Nagpur, Maharashtra', description: 'Current Address' })
  @IsOptional()
  @IsString()
  currentAddress?: string;

  @ApiPropertyOptional({ example: 'Nagpur, Maharashtra', description: 'Permanent Address' })
  @IsOptional()
  @IsString()
  permanentAddress?: string;

  @ApiPropertyOptional({ example: 'Nagpur', description: 'City' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ example: 'Maharashtra', description: 'State' })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiPropertyOptional({ example: 'India', default: 'India', description: 'Country' })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiPropertyOptional({ example: '440001', description: 'Pincode' })
  @IsOptional()
  @IsString()
  pincode?: string;

  // Employment Info
  @ApiProperty({ example: 'IT', description: 'Department' })
  @IsNotEmpty({ message: 'Department is required' })
  @IsString()
  department: string;

  @ApiProperty({ example: 'Developer', description: 'Designation' })
  @IsNotEmpty({ message: 'Designation is required' })
  @IsString()
  designation: string;

  @ApiPropertyOptional({ example: 'Rahul Sharma', description: 'Reporting Manager Name' })
  @IsOptional()
  @IsString()
  reportingManager?: string;

  @ApiProperty({ example: '2025-01-15', description: 'Joining Date (YYYY-MM-DD)' })
  @IsNotEmpty({ message: 'Joining Date is required' })
  @IsDateString({}, { message: 'Invalid joining date' })
  joiningDate: string;

  @ApiProperty({ example: 'Permanent', description: 'Employment Type (Permanent, Contract, etc.)' })
  @IsNotEmpty({ message: 'Employment type is required' })
  @IsString()
  employmentType: string;

  @ApiPropertyOptional({ example: 'Nagpur Office', description: 'Work Location' })
  @IsOptional()
  @IsString()
  workLocation?: string;

  @ApiPropertyOptional({ example: 'General', default: 'General', description: 'Shift' })
  @IsOptional()
  @IsString()
  shift?: string;

  @ApiPropertyOptional({ example: 'Active', default: 'Active', description: 'Status' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ example: 'Monthly', default: 'Monthly', description: 'Salary Type' })
  @IsOptional()
  @IsString()
  salaryType?: string;

  // Bank Info
  @ApiPropertyOptional({ example: 'Rahul Sharma', description: 'Account Holder Name' })
  @IsOptional()
  @IsString()
  accountHolderName?: string;

  @ApiPropertyOptional({ example: 'State Bank Of India', description: 'Bank Name' })
  @IsOptional()
  @IsString()
  bankName?: string;

  @ApiPropertyOptional({ example: 'Nagpur Main Branch', description: 'Branch Name' })
  @IsOptional()
  @IsString()
  branchName?: string;

  @ApiPropertyOptional({ example: 'XXXXXXXX4567', description: 'Account Number' })
  @IsOptional()
  @IsString()
  accountNumber?: string;

  @ApiPropertyOptional({ example: 'SBIN0001234', description: 'IFSC Code' })
  @IsOptional()
  @IsString()
  ifscCode?: string;

  @ApiPropertyOptional({ example: '123456789', description: 'MICR Code' })
  @IsOptional()
  @IsString()
  micrCode?: string;

  @ApiPropertyOptional({ example: 'rahul@sbi', description: 'UPI ID' })
  @IsOptional()
  @IsString()
  upiId?: string;

  @ApiPropertyOptional({ example: 'Yes', default: 'Yes', description: 'Salary Account Status' })
  @IsOptional()
  @IsString()
  salaryAccount?: string;

  // Documents
  @ApiPropertyOptional({ example: '123456789012', description: 'Aadhaar Number' })
  @IsOptional()
  @IsString()
  aadhaarNumber?: string;

  @ApiPropertyOptional({ example: 'ABCDE1234F', description: 'PAN Number' })
  @IsOptional()
  @IsString()
  panNumber?: string;

  @ApiPropertyOptional({ example: 'Z1234567', description: 'Passport Number' })
  @IsOptional()
  @IsString()
  passportNumber?: string;

  // Emergency Info
  @ApiPropertyOptional({ example: 'Rakesh Sharma', description: 'Emergency Contact Person Name' })
  @IsOptional()
  @IsString()
  emergencyPerson?: string;

  @ApiPropertyOptional({ example: 'Father', description: 'Relationship' })
  @IsOptional()
  @IsString()
  relationship?: string;

  @ApiPropertyOptional({ example: '9876543211', description: 'Emergency Contact Mobile' })
  @IsOptional()
  @IsString()
  emergencyMobile?: string;

  @ApiPropertyOptional({ example: 'Nagpur, Maharashtra', description: 'Emergency Contact Address' })
  @IsOptional()
  @IsString()
  emergencyAddress?: string;

  // Profile Image URL / base64
  @ApiPropertyOptional({ example: 'data:image/png;base64,...', description: 'Profile image path or base64 data' })
  @IsOptional()
  @IsString()
  profileImage?: string;
}
