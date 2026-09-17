import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { User } from '../../users/schemas/user.schema';
import { Contact } from '../../contacts/schemas/contact.schema';
import { Property } from '../../properties/schemas/property.schema';

export type SaleAgreementDocument = SaleAgreement & Document;

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
export class SaleAgreement {
  // ==========================================
  // Basic Details (Step 1)
  // ==========================================
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Contact',
    required: true,
    index: true,
  })
  buyer: Contact;

  @Prop({ required: false, trim: true })
  inNameOf?: string;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Property',
    required: true,
    index: true,
  })
  property: Property;

  @Prop({ required: false, trim: true })
  agreementDate?: string;

  @Prop({ required: false, trim: true })
  validTo?: string;

  @Prop({ required: false, trim: true })
  crNumber?: string;

  @Prop({ required: false, type: Number })
  agreementValue?: number;

  // ==========================================
  // Agreement Charges (Step 2)
  // ==========================================
  @Prop({ required: false, type: Number })
  advanceMaintenance?: number;

  @Prop({ required: false, type: Number })
  buyersContribution?: number;

  @Prop({ required: false, type: Number })
  brokerageBuyer?: number;

  @Prop({ required: false, type: Number })
  brokerageSeller?: number;

  @Prop({ required: false, type: Number })
  brokerageTotal?: number;

  @Prop({ required: false, type: Number })
  parkingCharges?: number;

  @Prop({ required: false, type: Number })
  loanAmount?: number;

  @Prop({ required: false, trim: true })
  transferType?: string;

  @Prop({ required: false, type: Number })
  transferCharges?: number;

  @Prop({ required: false, type: Number })
  developmentCharges?: number;

  @Prop({ required: false, type: Number })
  registrationCost?: number;

  @Prop({ required: false, type: Number })
  documentationCharges?: number;

  @Prop({ required: false, type: Number })
  stampDuty?: number;

  @Prop({ required: false, type: Number })
  furnitureAndFixtures?: number;

  @Prop({ required: false, type: Number })
  otherExpense?: number;

  @Prop({ required: false, type: Number })
  vatPercent?: number;

  @Prop({ required: false, type: Number })
  interestRatePercent?: number;

  @Prop({ required: false, type: Number })
  gstPercent?: number;

  // ==========================================
  // Save and Publish (Step 3)
  // ==========================================
  @Prop({ required: false, trim: true })
  termsAndConditions?: string;

  // ==========================================
  // Denormalized Fields for High Performance
  // ==========================================
  @Prop({ required: false, trim: true, index: true })
  building?: string; // Denormalized from Property.buildingTowerProject for fast sorting

  // ==========================================
  // Ownership / Assignment References
  // ==========================================
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'User',
    required: false,
    index: true,
  })
  createdBy?: User;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'User',
    required: false,
    index: true,
  })
  assignedTo?: User;
}

export const SaleAgreementSchema = SchemaFactory.createForClass(SaleAgreement);
