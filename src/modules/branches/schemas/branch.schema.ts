import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type BranchDocument = Branch & Document;

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
export class Branch {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  assigneeTo: MongooseSchema.Types.ObjectId;

  @Prop({ type: [{ type: MongooseSchema.Types.ObjectId, ref: 'User' }], default: [] })
  assignees: MongooseSchema.Types.ObjectId[];

  @Prop({ required: false, default: '' })
  untouchDuration: string;

  @Prop({ required: false, default: 'Assign To Owner' })
  routing: string;
}

export const BranchSchema = SchemaFactory.createForClass(Branch);
