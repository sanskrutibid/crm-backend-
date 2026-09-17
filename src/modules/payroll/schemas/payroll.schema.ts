import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ProcessedPayrollDocument = ProcessedPayroll & Document;

@Schema({ timestamps: true })
export class ProcessedPayroll {
  @Prop({ required: true })
  employeeId: string;

  @Prop({ required: true })
  employeeName: string;

  @Prop({ default: 'General' })
  department: string;

  @Prop({ required: true })
  month: string;

  @Prop({ required: true })
  year: number;

  @Prop({ default: 0 })
  gross: number;

  @Prop({ default: 0 })
  deduction: number;

  @Prop({ default: 0 })
  net: number;

  @Prop({ default: 'Pending' })
  status: string;

  @Prop()
  processedDate: string;

  @Prop({ type: Object })
  salaryBreakdown: Record<string, any>;
}

export const ProcessedPayrollSchema = SchemaFactory.createForClass(ProcessedPayroll);
