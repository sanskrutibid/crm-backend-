import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type SalaryStructureDocument = SalaryStructure & Document;

@Schema({ timestamps: true })
export class SalaryStructure {
  @Prop({ required: true, unique: true })
  employeeId: string;

  @Prop({ required: true })
  employeeName: string;

  @Prop({ default: 'General' })
  department: string;

  @Prop({ default: 'Staff' })
  designation: string;

  @Prop({ default: 'Monthly' })
  salaryType: string;

  @Prop()
  effectiveDate: string;

  @Prop({ default: 0 })
  basicSalary: number;

  @Prop({ default: 0 })
  hra: number;

  @Prop({ default: 0 })
  da: number;

  @Prop({ default: 0 })
  conveyance: number;

  @Prop({ default: 0 })
  medical: number;

  @Prop({ default: 0 })
  specialAllowance: number;

  @Prop({ default: 0 })
  bonus: number;

  @Prop({ default: 0 })
  otherAllowance: number;

  @Prop({ default: 0 })
  pf: number;

  @Prop({ default: 0 })
  esic: number;

  @Prop({ default: 0 })
  professionalTax: number;

  @Prop({ default: 0 })
  tds: number;

  @Prop({ default: 0 })
  loan: number;

  @Prop({ default: 0 })
  advanceSalary: number;

  @Prop({ default: 0 })
  otherDeduction: number;

  @Prop({ default: 0 })
  grossSalary: number;

  @Prop({ default: 0 })
  totalDeduction: number;

  @Prop({ default: 0 })
  netSalary: number;

  @Prop()
  remarks: string;
}

export const SalaryStructureSchema = SchemaFactory.createForClass(SalaryStructure);
