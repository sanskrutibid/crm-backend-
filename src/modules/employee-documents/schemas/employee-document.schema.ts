import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document as MongooseDocument } from 'mongoose';

export type EmployeeDocumentDocument = EmployeeDocumentClass & MongooseDocument;

@Schema({
  timestamps: true,
  toJSON: {
    transform: (doc, ret: any) => {
      ret.id = ret._id.toString();
      delete ret._id;
      delete ret.__v;
      return ret;
    },
  },
})
export class EmployeeDocumentClass {
  @Prop({ required: true, trim: true, index: true })
  employeeId: string;

  @Prop({ required: true, trim: true })
  employeeName: string;

  @Prop({ required: false, trim: true })
  department?: string;

  @Prop({ required: true, trim: true, index: true })
  documentType: string;

  @Prop({ required: true, trim: true, index: true })
  documentNumber: string;

  @Prop({ required: false, trim: true })
  issueDate?: string;

  @Prop({ required: false, trim: true })
  expiryDate?: string;

  @Prop({ required: false, trim: true })
  frontFile?: string;

  @Prop({ required: false, trim: true })
  backFile?: string;

  @Prop({ required: false, trim: true })
  remarks?: string;

  @Prop({ required: true, trim: true, default: () => new Date().toISOString().split('T')[0] })
  uploadDate: string;

  @Prop({ required: true, trim: true, default: 'Verified' })
  status: string;
}

export const EmployeeDocumentSchema = SchemaFactory.createForClass(EmployeeDocumentClass);
