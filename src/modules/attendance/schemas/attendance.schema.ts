import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { User } from '../../users/schemas/user.schema';

export type AttendanceDocument = Attendance & Document;

/**
 * Nested schema to record fine-grained GPS coordinate snapshots.
 */
@Schema({ _id: false })
export class LocationPoint {
  @Prop({ required: true, type: Number })
  latitude: number;

  @Prop({ required: true, type: Number })
  longitude: number;

  @Prop({ required: true, type: Date, default: Date.now })
  timestamp: Date;
}

const LocationPointSchema = SchemaFactory.createForClass(LocationPoint);

/**
 * Main Attendance & Geo-tracking schema.
 * Maps sales agent shifts and stores their periodic movement path logs.
 */
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
export class Attendance {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  })
  userId: any;

  @Prop({ required: true, trim: true, index: true })
  date: string; // Format: YYYY-MM-DD for fast shift grouping and indexing

  @Prop({ type: Date })
  punchInTime?: Date;

  @Prop({ type: LocationPointSchema })
  punchInLocation?: LocationPoint;

  @Prop({ type: Date })
  punchOutTime?: Date;

  @Prop({ type: LocationPointSchema })
  punchOutLocation?: LocationPoint;

  @Prop({
    required: true,
    enum: ['ACTIVE', 'COMPLETED'],
    default: 'ACTIVE',
    index: true,
  })
  status: string;

  @Prop({ type: [LocationPointSchema], default: [] })
  path: LocationPoint[];

  @Prop({ type: String })
  remarks?: string;

  @Prop({ type: String })
  lateBy?: string;

  @Prop({ type: String })
  workingHours?: string;

  @Prop({ type: String })
  manualStatus?: string;
}

export const AttendanceSchema = SchemaFactory.createForClass(Attendance);
