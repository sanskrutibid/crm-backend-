import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EmployeeDocumentsController } from './employee-documents.controller';
import { EmployeeDocumentsService } from './employee-documents.service';
import {
  EmployeeDocumentClass,
  EmployeeDocumentSchema,
} from './schemas/employee-document.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: EmployeeDocumentClass.name, schema: EmployeeDocumentSchema },
    ]),
  ],
  controllers: [EmployeeDocumentsController],
  providers: [EmployeeDocumentsService],
  exports: [EmployeeDocumentsService],
})
export class EmployeeDocumentsModule {}
