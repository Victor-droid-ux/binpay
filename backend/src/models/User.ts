import mongoose, { Schema, Document } from "mongoose";
import { AccountType, ApprovalStatus } from "../utils/accountTypes";

export enum UserRole {
  USER = "USER",
  STATE_ADMIN = "STATE_ADMIN",
  SUPER_ADMIN = "SUPER_ADMIN",
}

export interface Permission {
  id: string;
  name: string;
  description: string;
  canView: boolean;
  canCreate: boolean;
  canUpdate: boolean;
}

export interface IUser extends Document {
  email: string;
  phone: string;
  password: string;
  firstName: string;
  lastName: string;
  organizationName?: string;
  registrationNumber?: string;
  contactPersonName?: string;
  contactPersonPhone?: string;
  organizationCategory?: string;
  numberOfBins?: number;
  approvalStatus: ApprovalStatus;
  approvalNote?: string;
  approvedAt?: Date;
  approvedBy?: mongoose.Types.ObjectId;
  address?: string; // Accepts any address format
  role: UserRole;
  accountType: AccountType;
  stateCode?: string;
  permissions?: Permission[];
  isActive: boolean;
  isVerified: boolean;
  emailVerified: boolean;
  phoneVerified: boolean;
  lastLogin?: Date;
  resetCode?: string;
  resetCodeExpiry?: Date;
  emailVerificationCode?: string;
  emailVerificationCodeExpiry?: Date;
  loginOtpCode?: string;
  loginOtpExpiry?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true, lowercase: true },
    phone: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    firstName: { type: String, required: true },
    lastName: {
      type: String,
      required: function (this: IUser) {
        return this.accountType === AccountType.INDIVIDUAL;
      },
      default: "",
    },
    organizationName: { type: String },
    registrationNumber: { type: String },
    contactPersonName: { type: String },
    contactPersonPhone: { type: String },
    organizationCategory: { type: String },
    numberOfBins: { type: Number, min: 1 },
    // Existing and individual accounts are APPROVED by default
    approvalStatus: {
      type: String,
      enum: Object.values(ApprovalStatus),
      default: ApprovalStatus.APPROVED,
    },
    approvalNote: { type: String },
    approvedAt: { type: Date },
    approvedBy: { type: Schema.Types.ObjectId, ref: "User" },
    address: { type: String }, // Accepts any address format
    role: {
      type: String,
      enum: Object.values(UserRole),
      default: UserRole.USER,
    },
    accountType: {
      type: String,
      enum: Object.values(AccountType),
      default: AccountType.INDIVIDUAL,
    },
    stateCode: { type: String },
    permissions: [
      {
        id: { type: String },
        name: { type: String },
        description: { type: String },
        canView: { type: Boolean, default: false },
        canCreate: { type: Boolean, default: false },
        canUpdate: { type: Boolean, default: false },
      },
    ],
    isActive: { type: Boolean, default: true },
    isVerified: { type: Boolean, default: false },
    emailVerified: { type: Boolean, default: false },
    phoneVerified: { type: Boolean, default: false },
    lastLogin: { type: Date },
    resetCode: { type: String },
    resetCodeExpiry: { type: Date },
    emailVerificationCode: { type: String },
    emailVerificationCodeExpiry: { type: Date },
    loginOtpCode: { type: String },
    loginOtpExpiry: { type: Date },
  },
  {
    timestamps: true,
  },
);

userSchema.index({ stateCode: 1 });
userSchema.index({ registrationNumber: 1 }, { sparse: true });

export const User = mongoose.model<IUser>("User", userSchema);
