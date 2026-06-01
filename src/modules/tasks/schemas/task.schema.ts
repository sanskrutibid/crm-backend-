import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { User } from '../../users/schemas/user.schema';

export type TaskDocument = Task & Document;

/**
 * Task completion status enum.
 * Tracks 'Open' tasks versus 'Closed' tasks.
 */
export enum TaskStatus {
  OPEN = 'Open',
  CLOSED = 'Closed',
}

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
export class Task {
  @Prop({ required: true, trim: true })
  task: string; // Task summary/headline

  @Prop({ trim: true })
  description?: string;

  @Prop({ required: true, trim: true })
  scheduledDate: string; // e.g. "2026-05-26" or "26-May-2026"

  @Prop({ required: true, trim: true })
  scheduleTime: string; // e.g. "3:43pm"

  @Prop({ trim: true })
  branch?: string;

  @Prop({
    required: true,
    enum: TaskStatus,
    default: TaskStatus.OPEN,
    index: true,
  })
  status: TaskStatus;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  })
  assignedTo: User;
}

export const TaskSchema = SchemaFactory.createForClass(Task);
