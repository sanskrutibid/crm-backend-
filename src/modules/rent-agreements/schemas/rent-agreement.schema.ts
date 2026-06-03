import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { User } from '../../users/schemas/user.schema';
import { Contact } from '../../contacts/schemas/contact.schema';
import { Property } from '../../properties/schemas/property.schema';

export type RentAgreementDocument = RentAgreement & Document;

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
export class RentAgreement {
  // ==========================================
  // Basic Details (Step 1)
  // ==========================================
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Contact',
    required: true,
    index: true,
  })
  tenant: Contact;

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

  // ==========================================
  // Agreement Charges (Step 2)
  // ==========================================
  @Prop({ required: false, type: Number })
  rentPerMonth?: number;

  @Prop({ required: false, type: Number })
  securityDeposit?: number;

  @Prop({ required: false, type: Number })
  registrationCost?: number;

  @Prop({ required: false, type: Number })
  brokerageLicensor?: number;

  @Prop({ required: false, type: Number })
  brokerageLicensee?: number;

  @Prop({ required: false, type: Number })
  brokerageTotal?: number;

  @Prop({ required: false, type: Number })
  documentationCharges?: number;

  @Prop({ required: false, type: Number })
  stampDuty?: number;

  @Prop({ required: false, type: Number })
  otherExpense?: number;

  @Prop({ required: false, type: Number })
  furnitureAndFixtures?: number;

  @Prop({ required: false, trim: true })
  legalChargesPaidBy?: string;

  // ==========================================
  // Save and Publish (Step 3)
  // ==========================================
  @Prop({ required: false, type: Number })
  rentReminderDay?: number;

  @Prop({ required: false, trim: true })
  termsAndConditions?: string;

  @Prop({ required: false, type: Boolean, default: false })
  sendLeaseExpiryAlertToOwner?: boolean;

  @Prop({ required: false, type: Boolean, default: false })
  sendLeaseExpiryAlertToTenant?: boolean;

  @Prop({ required: false, type: Boolean, default: false })
  sendSmsRentReminderToTenant?: boolean;

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

export const RentAgreementSchema = SchemaFactory.createForClass(RentAgreement);
