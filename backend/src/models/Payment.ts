import mongoose, { Schema, Document } from 'mongoose';

export enum PaymentStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
}

export enum PaymentMethod {
  CARD = 'CARD',
  BANK_TRANSFER = 'BANK_TRANSFER',
  USSD = 'USSD',
  MOBILE_MONEY = 'MOBILE_MONEY',
  POS = 'POS',
}

export interface IPayment extends Document {
  transactionRef: string;
  paystackRef?: string;
  billId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  stateCode: string;
  amount: number;
  fee: number;
  totalAmount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  paidAt?: Date;
  failureReason?: string;
  customerEmail: string;
  customerPhone: string;
  metadata?: Record<string, any>;
  webhookReceived: boolean;
  webhookData?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const paymentSchema = new Schema<IPayment>(
  {
    transactionRef: { type: String, required: true, unique: true },
    paystackRef: { type: String, unique: true, sparse: true },
    billId: { type: Schema.Types.ObjectId, ref: 'Bill', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    stateCode: { type: String, required: true },
    amount: { type: Number, required: true },
    fee: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true },
    method: { type: String, enum: Object.values(PaymentMethod), required: true },
    status: { type: String, enum: Object.values(PaymentStatus), default: PaymentStatus.PENDING },
    paidAt: { type: Date },
    failureReason: { type: String },
    customerEmail: { type: String, required: true },
    customerPhone: { type: String, required: true },
    metadata: { type: Schema.Types.Mixed },
    webhookReceived: { type: Boolean, default: false },
    webhookData: { type: Schema.Types.Mixed },
  },
  {
    timestamps: true,
  }
);

paymentSchema.index({ userId: 1 });
paymentSchema.index({ billId: 1 });
paymentSchema.index({ stateCode: 1 });
paymentSchema.index({ transactionRef: 1 });
paymentSchema.index({ paystackRef: 1 });
paymentSchema.index({ status: 1 });

export const Payment = mongoose.model<IPayment>('Payment', paymentSchema);
