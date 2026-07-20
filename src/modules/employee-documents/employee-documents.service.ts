import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  EmployeeDocumentClass,
  EmployeeDocumentDocument,
} from './schemas/employee-document.schema';
import { CreateEmployeeDocumentDto } from './dto/create-employee-document.dto';
import { UpdateEmployeeDocumentDto } from './dto/update-employee-document.dto';

@Injectable()
export class EmployeeDocumentsService implements OnModuleInit {
  constructor(
    @InjectModel(EmployeeDocumentClass.name)
    private readonly empDocModel: Model<EmployeeDocumentDocument>,
  ) {}

  async onModuleInit() {
    const count = await this.empDocModel.countDocuments().exec();
    if (count === 0) {
      const seedDocs: Partial<EmployeeDocumentClass>[] = [
        {
          employeeId: 'EMP001',
          employeeName: 'Rahul Sharma',
          department: 'IT / Engineering',
          documentType: 'Aadhaar Card',
          documentNumber: '1234 5678 9876',
          uploadDate: '2026-07-12',
          expiryDate: '-',
          status: 'Verified',
          frontFile: 'assets/images/user.png',
          backFile: 'assets/images/user.png',
          remarks: 'Aadhaar card verified during employee onboarding',
        },
        {
          employeeId: 'EMP002',
          employeeName: 'Priya Patel',
          department: 'Human Resources',
          documentType: 'PAN Card',
          documentNumber: 'ABCDE1234F',
          uploadDate: '2026-07-10',
          expiryDate: '-',
          status: 'Verified',
          frontFile: 'assets/images/user.png',
          remarks: 'PAN verification complete',
        },
        {
          employeeId: 'EMP003',
          employeeName: 'Amit Singh',
          department: 'Sales & Marketing',
          documentType: 'Passport',
          documentNumber: 'N4587965',
          uploadDate: '2026-07-05',
          expiryDate: '2030-08-20',
          status: 'Pending',
          frontFile: 'assets/images/user.png',
          backFile: 'assets/images/user.png',
          remarks: 'Physical passport check pending',
        },
        {
          employeeId: 'EMP004',
          employeeName: 'Sneha Verma',
          department: 'Finance & Accounts',
          documentType: 'Driving License',
          documentNumber: 'MH3120240001234',
          uploadDate: '2026-07-01',
          expiryDate: '2026-07-15',
          status: 'Expired',
          frontFile: 'assets/images/user.png',
          backFile: 'assets/images/user.png',
          remarks: 'License renewal required',
        },
      ];
      await this.empDocModel.insertMany(seedDocs);
    }
  }

  async findAll(query?: any): Promise<{ documents: EmployeeDocumentClass[]; total: number }> {
    const filter: any = {};

    if (query?.department && query.department !== 'All') {
      filter.department = query.department;
    }
    if (query?.documentType && query.documentType !== 'All') {
      filter.documentType = query.documentType;
    }
    if (query?.status && query.status !== 'All') {
      filter.status = query.status;
    }
    if (query?.search) {
      const q = query.search;
      filter.$or = [
        { employeeName: { $regex: q, $options: 'i' } },
        { employeeId: { $regex: q, $options: 'i' } },
        { documentNumber: { $regex: q, $options: 'i' } },
        { documentType: { $regex: q, $options: 'i' } },
      ];
    }

    const [documents, total] = await Promise.all([
      this.empDocModel.find(filter).sort({ createdAt: -1 }).exec(),
      this.empDocModel.countDocuments(filter).exec(),
    ]);

    return { documents, total };
  }

  async findOne(id: string): Promise<EmployeeDocumentClass> {
    const doc = await this.empDocModel.findById(id).exec();
    if (!doc) {
      throw new NotFoundException(`Employee Document with ID "${id}" not found`);
    }
    return doc;
  }

  async create(dto: CreateEmployeeDocumentDto): Promise<EmployeeDocumentClass> {
    const newDoc = new this.empDocModel({
      ...dto,
      uploadDate: dto.uploadDate || new Date().toISOString().split('T')[0],
      status: dto.status || 'Verified',
    });
    return newDoc.save();
  }

  async update(id: string, dto: UpdateEmployeeDocumentDto): Promise<EmployeeDocumentClass> {
    const updatedDoc = await this.empDocModel
      .findByIdAndUpdate(id, dto, { new: true })
      .exec();
    if (!updatedDoc) {
      throw new NotFoundException(`Employee Document with ID "${id}" not found`);
    }
    return updatedDoc;
  }

  async remove(id: string): Promise<void> {
    const result = await this.empDocModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(`Employee Document with ID "${id}" not found`);
    }
  }
}
