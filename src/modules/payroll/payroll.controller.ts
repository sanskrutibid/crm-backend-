import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { PayrollBackendService } from './payroll.service';
import { CreateSalaryStructureDto } from './dto/create-salary-structure.dto';

@Controller('payroll')
export class PayrollController {
  constructor(private readonly payrollService: PayrollBackendService) {}

  @Get('salary-structure')
  async getSalaryStructures() {
    const data = await this.payrollService.getSalaryStructures();
    return { success: true, data };
  }

  @Get('salary-structure/employee/:employeeId')
  async getSalaryStructureByEmployee(@Param('employeeId') employeeId: string) {
    const data = await this.payrollService.getSalaryStructureByEmployee(employeeId);
    return { success: true, data };
  }

  @Post('salary-structure')
  async saveSalaryStructure(@Body() dto: CreateSalaryStructureDto) {
    const data = await this.payrollService.saveSalaryStructure(dto);
    return { success: true, message: 'Salary structure saved successfully', data };
  }

  @Delete('salary-structure/employee/:employeeId')
  async deleteSalaryStructure(@Param('employeeId') employeeId: string) {
    await this.payrollService.deleteSalaryStructure(employeeId);
    return { success: true, message: 'Salary structure deleted successfully' };
  }

  @Get('processed')
  async getProcessedPayrolls(
    @Query('month') month?: string,
    @Query('year') year?: number,
  ) {
    const data = await this.payrollService.getProcessedPayrolls(month, year);
    return { success: true, data };
  }

  @Post('processed')
  async saveProcessedPayrolls(@Body() payrolls: any[]) {
    const data = await this.payrollService.saveProcessedPayrolls(payrolls);
    return { success: true, message: 'Payrolls saved/processed successfully', data };
  }
}
