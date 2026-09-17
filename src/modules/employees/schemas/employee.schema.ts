import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type EmployeeDocument = Employee & Document;

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
export class Employee {
  // Personal Info
  @Prop({ required: true, unique: true, trim: true })
  employeeId: string;

  @Prop({ required: true, trim: true })
  firstName: string;

  @Prop({ trim: true, default: '' })
  middleName?: string;

  @Prop({ required: true, trim: true })
  lastName: string;

  @Prop({ required: true, trim: true })
  gender: string;

  @Prop({ required: true })
  dob: Date;

  @Prop({ trim: true, default: '' })
  bloodGroup?: string;

  @Prop({ trim: true, default: '' })
  maritalStatus?: string;

  @Prop({ trim: true, default: 'Indian' })
  nationality?: string;

  // Contact Info
  @Prop({ required: true, trim: true })
  mobile: string;

  @Prop({ trim: true, default: '' })
  alternateMobile?: string;

  @Prop({ required: true, unique: true, trim: true })
  personalEmail: string;

  @Prop({ trim: true, default: '' })
  officialEmail?: string;

  @Prop({ trim: true, default: '' })
  currentAddress?: string;

  @Prop({ trim: true, default: '' })
  permanentAddress?: string;

  @Prop({ trim: true, default: '' })
  city?: string;

  @Prop({ trim: true, default: '' })
  state?: string;

  @Prop({ trim: true, default: 'India' })
  country?: string;

  @Prop({ trim: true, default: '' })
  pincode?: string;

  // Employment Info
  @Prop({ required: true, trim: true })
  department: string;

  @Prop({ required: true, trim: true })
  designation: string;

  @Prop({ trim: true, default: '' })
  reportingManager?: string;

  @Prop({ required: true })
  joiningDate: Date;

  @Prop({ required: true, trim: true })
  employmentType: string;

  @Prop({ trim: true, default: '' })
  workLocation?: string;

  @Prop({ trim: true, default: 'General' })
  shift?: string;

  @Prop({ trim: true, default: 'Active' })
  status?: string;

  @Prop({ trim: true, default: 'Monthly' })
  salaryType?: string;

  // Bank Info
  @Prop({ trim: true, default: '' })
  accountHolderName?: string;

  @Prop({ trim: true, default: '' })
  bankName?: string;

  @Prop({ trim: true, default: '' })
  branchName?: string;

  @Prop({ trim: true, default: '' })
  accountNumber?: string;

  @Prop({ trim: true, default: '' })
  ifscCode?: string;

  @Prop({ trim: true, default: '' })
  micrCode?: string;

  @Prop({ trim: true, default: '' })
  upiId?: string;

  @Prop({ trim: true, default: 'Yes' })
  salaryAccount?: string;

  // Documents
  @Prop({ trim: true, default: '' })
  aadhaarNumber?: string;

  @Prop({ trim: true, default: '' })
  panNumber?: string;

  @Prop({ trim: true, default: '' })
  passportNumber?: string;

  // Emergency Info
  @Prop({ trim: true, default: '' })
  emergencyPerson?: string;

  @Prop({ trim: true, default: '' })
  relationship?: string;

  @Prop({ trim: true, default: '' })
  emergencyMobile?: string;

  @Prop({ trim: true, default: '' })
  emergencyAddress?: string;

  // Image
  @Prop({ trim: true, default: '' })
  profileImage?: string;

  @Prop({ trim: true, default: '' })
  password?: string;
}

export const EmployeeSchema = SchemaFactory.createForClass(Employee);
