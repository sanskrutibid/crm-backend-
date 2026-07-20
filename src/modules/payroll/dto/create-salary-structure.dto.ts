import { IsString, IsNotEmpty, IsOptional, IsNumber } from 'class-validator';

export class CreateSalaryStructureDto {
  @IsString()
  @IsNotEmpty()
  employeeId: string;

  @IsString()
  @IsNotEmpty()
  employeeName: string;

  @IsString()
  @IsOptional()
  department?: string;

  @IsString()
  @IsOptional()
  designation?: string;

  @IsString()
  @IsOptional()
  salaryType?: string;

  @IsString()
  @IsOptional()
  effectiveDate?: string;

  @IsNumber()
  basicSalary: number;

  @IsNumber()
  @IsOptional()
  hra?: number;

  @IsNumber()
  @IsOptional()
  da?: number;

  @IsNumber()
  @IsOptional()
  conveyance?: number;

  @IsNumber()
  @IsOptional()
  medical?: number;

  @IsNumber()
  @IsOptional()
  specialAllowance?: number;

  @IsNumber()
  @IsOptional()
  bonus?: number;

  @IsNumber()
  @IsOptional()
  otherAllowance?: number;

  @IsNumber()
  @IsOptional()
  pf?: number;

  @IsNumber()
  @IsOptional()
  esic?: number;

  @IsNumber()
  @IsOptional()
  professionalTax?: number;

  @IsNumber()
  @IsOptional()
  tds?: number;

  @IsNumber()
  @IsOptional()
  loan?: number;

  @IsNumber()
  @IsOptional()
  advanceSalary?: number;

  @IsNumber()
  @IsOptional()
  otherDeduction?: number;

  @IsNumber()
  @IsOptional()
  grossSalary?: number;

  @IsNumber()
  @IsOptional()
  totalDeduction?: number;

  @IsNumber()
  @IsOptional()
  netSalary?: number;

  @IsString()
  @IsOptional()
  remarks?: string;
}
