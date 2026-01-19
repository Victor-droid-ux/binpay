import mongoose, { Schema, Document } from 'mongoose';

export interface IBinRegistration extends Document {
  binId: string;
  userId?: mongoose.Types.ObjectId;
  stateCode: string;
  lgaName: string;
  address: string;
  customerRef?: string;
  isActive: boolean;
  registeredAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const binRegistrationSchema = new Schema<IBinRegistration>(
  {
    binId: { type: String, required: true, unique: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: false },
    stateCode: { type: String, required: true },
    lgaName: { type: String, required: true },
    address: { type: String, required: true },
    customerRef: { type: String },
    isActive: { type: Boolean, default: true },
    registeredAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  }
);

binRegistrationSchema.index({ userId: 1 });
binRegistrationSchema.index({ binId: 1 });
binRegistrationSchema.index({ stateCode: 1 });

export const BinRegistration = mongoose.model<IBinRegistration>('BinRegistration', binRegistrationSchema);
