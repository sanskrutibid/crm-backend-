import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { SalaryStructure, SalaryStructureDocument } from './schemas/salary-structure.schema';
import { ProcessedPayroll, ProcessedPayrollDocument } from './schemas/payroll.schema';
import { CreateSalaryStructureDto } from './dto/create-salary-structure.dto';

@Injectable()
export class PayrollBackendService {
  constructor(
    @InjectModel(SalaryStructure.name)
    private salaryStructureModel: Model<SalaryStructureDocument>,
    @InjectModel(ProcessedPayroll.name)
    private processedPayrollModel: Model<ProcessedPayrollDocument>,
  ) {}

  // Salary Structure Methods
  async getSalaryStructures(): Promise<SalaryStructure[]> {
    return this.salaryStructureModel.find().exec();
  }

  async getSalaryStructureByEmployee(employeeId: string): Promise<SalaryStructure | null> {
    return this.salaryStructureModel.findOne({ employeeId }).exec();
  }

  async saveSalaryStructure(dto: CreateSalaryStructureDto): Promise<SalaryStructure> {
    const existing = await this.salaryStructureModel.findOne({ employeeId: dto.employeeId }).exec();
    if (existing) {
      Object.assign(existing, dto);
      return existing.save();
    }
    const created = new this.salaryStructureModel(dto);
    return created.save();
  }

  async deleteSalaryStructure(employeeId: string): Promise<any> {
    return this.salaryStructureModel.deleteOne({ employeeId }).exec();
  }

  // Processed Payroll Methods
  async getProcessedPayrolls(month?: string, year?: number): Promise<ProcessedPayroll[]> {
    const filter: any = {};
    if (month && month !== 'All') filter.month = month;
    if (year) filter.year = Number(year);
    return this.processedPayrollModel.find(filter).exec();
  }

  async saveProcessedPayrolls(payrolls: any[]): Promise<any> {
    const results: any[] = [];
    for (const item of payrolls) {
      const existing = await this.processedPayrollModel.findOne({
        employeeId: item.employeeId,
        month: item.month,
        year: item.year,
      }).exec();

      if (existing) {
        Object.assign(existing, item);
        results.push(await existing.save());
      } else {
        const created = new this.processedPayrollModel(item);
        results.push(await created.save());
      }
    }
    return results;
  }
}
