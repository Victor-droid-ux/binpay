import mongoose, { Schema, Document } from 'mongoose';

export interface ILGA {
  name: string;
}

export interface IZone {
  name: string;
}

export interface IState extends Document {
  name: string;
  code: string;
  capital: string;
  authorityName: string;
  authorityFullName: string;
  authorityWebsite?: string;
  authorityPhone?: string;
  authorityEmail?: string;
  headquarters: string;
  binIdFormat: string;
  billCycle: string;
  averageBill: number; // Deprecated - use monthlyBillAmount
  monthlyBillAmount: number; // Current monthly bill amount for the state
  isActive: boolean;
  lgas: ILGA[];
  zones: IZone[];
  createdAt: Date;
  updatedAt: Date;
}

const stateSchema = new Schema<IState>(
  {
    name: { type: String, required: true, unique: true },
    code: { type: String, required: true, unique: true },
    capital: { type: String, required: true },
    authorityName: { type: String, required: true },
    authorityFullName: { type: String, required: true },
    authorityWebsite: { type: String },
    authorityPhone: { type: String },
    authorityEmail: { type: String },
    headquarters: { type: String, required: true },
    binIdFormat: { type: String, required: true },
    billCycle: { type: String, required: true },
    averageBill: { type: Number, required: true },
    monthlyBillAmount: { type: Number, required: true, default: 1500 },
    isActive: { type: Boolean, default: true },
    lgas: [{ name: { type: String, required: true } }],
    zones: [{ name: { type: String, required: true } }],
  },
  {
    timestamps: true,
  }
);

stateSchema.index({ code: 1 });

export const State = mongoose.model<IState>('State', stateSchema);
