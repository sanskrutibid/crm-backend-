import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PayrollController } from './payroll.controller';
import { PayrollBackendService } from './payroll.service';
import { SalaryStructure, SalaryStructureSchema } from './schemas/salary-structure.schema';
import { ProcessedPayroll, ProcessedPayrollSchema } from './schemas/payroll.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: SalaryStructure.name, schema: SalaryStructureSchema },
      { name: ProcessedPayroll.name, schema: ProcessedPayrollSchema },
    ]),
  ],
  controllers: [PayrollController],
  providers: [PayrollBackendService],
  exports: [PayrollBackendService],
})
export class PayrollModule {}
