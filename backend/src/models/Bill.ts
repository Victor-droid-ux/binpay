import mongoose, { Schema, Document } from 'mongoose';

export enum BillStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  OVERDUE = 'OVERDUE',
  CANCELLED = 'CANCELLED',
}

export interface IBill extends Document {
  billNumber: string;
  binRegistrationId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  stateCode: string;
  zoneName?: string;
  amount: number;
  dueDate: Date;
  status: BillStatus;
  paidAt?: Date;
  paidAmount?: number;
  billingPeriod: string;
  description?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const billSchema = new Schema<IBill>(
  {
    billNumber: { type: String, required: true, unique: true },
    binRegistrationId: { type: Schema.Types.ObjectId, ref: 'BinRegistration', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    stateCode: { type: String, required: true },
    zoneName: { type: String },
    amount: { type: Number, required: true },
    dueDate: { type: Date, required: true },
    status: { type: String, enum: Object.values(BillStatus), default: BillStatus.PENDING },
    paidAt: { type: Date },
    paidAmount: { type: Number },
    billingPeriod: { type: String, required: true },
    description: { type: String },
    metadata: { type: Schema.Types.Mixed },
  },
  {
    timestamps: true,
  }
);

billSchema.index({ userId: 1 });
billSchema.index({ stateCode: 1 });
billSchema.index({ binRegistrationId: 1 });
billSchema.index({ billNumber: 1 });
billSchema.index({ status: 1 });
billSchema.index({ dueDate: 1 });

export const Bill = mongoose.model<IBill>('Bill', billSchema);
