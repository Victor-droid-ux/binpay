import mongoose, { Schema, Document } from 'mongoose';

export enum UserRole {
  USER = 'USER',
  STATE_ADMIN = 'STATE_ADMIN',
  SUPER_ADMIN = 'SUPER_ADMIN',
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
  role: UserRole;
  stateCode?: string;
  permissions?: Permission[];
  isActive: boolean;
  isVerified: boolean;
  emailVerified: boolean;
  phoneVerified: boolean;
  lastLogin?: Date;
  resetCode?: string;
  resetCodeExpiry?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true, lowercase: true },
    phone: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    role: { type: String, enum: Object.values(UserRole), default: UserRole.USER },
    stateCode: { type: String },
    permissions: [{
      id: { type: String },
      name: { type: String },
      description: { type: String },
      canView: { type: Boolean, default: false },
      canCreate: { type: Boolean, default: false },
      canUpdate: { type: Boolean, default: false },
    }],
    isActive: { type: Boolean, default: true },
    isVerified: { type: Boolean, default: false },
    emailVerified: { type: Boolean, default: false },
    phoneVerified: { type: Boolean, default: false },
    lastLogin: { type: Date },
    resetCode: { type: String },
    resetCodeExpiry: { type: Date },
  },
  {
    timestamps: true,
  }
);

userSchema.index({ email: 1 });
userSchema.index({ phone: 1 });
userSchema.index({ stateCode: 1 });

export const User = mongoose.model<IUser>('User', userSchema);
