import { Bill, BillStatus } from '../models/Bill';
import { BinRegistration } from '../models/BinRegistration';
import { State } from '../models/State';
import { Notification } from '../models/Notification';
import mongoose from 'mongoose';

/**
 * Generate a unique bill number
 * Format: BILL-STATECODE-YYYYMM-XXXXX
 */
export const generateBillNumber = async (stateCode: string): Promise<string> => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const prefix = `BILL-${stateCode.toUpperCase()}-${year}${month}`;

  // Count existing bills with this prefix
  const count = await Bill.countDocuments({
    billNumber: new RegExp(`^${prefix}`),
  });

  const sequence = String(count + 1).padStart(5, '0');
  return `${prefix}-${sequence}`;
};

/**
 * Get billing period string
 */
export const getBillingPeriod = (date: Date = new Date()): string => {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return `${months[date.getMonth()]} ${date.getFullYear()}`;
};

/**
 * Calculate due date (default: 15 days from billing date)
 */
export const calculateDueDate = (billingDate: Date = new Date(), daysUntilDue: number = 15): Date => {
  const dueDate = new Date(billingDate);
  dueDate.setDate(dueDate.getDate() + daysUntilDue);
  return dueDate;
};

/**
 * Generate a bill for a specific bin registration
 */
export const generateBillForBin = async (
  binRegistrationId: string | mongoose.Types.ObjectId,
  options: {
    billingDate?: Date;
    daysUntilDue?: number;
    customAmount?: number;
  } = {}
): Promise<any> => {
  const binRegistration = await BinRegistration.findById(binRegistrationId);

  if (!binRegistration) {
    throw new Error('Bin registration not found');
  }

  if (!binRegistration.userId) {
    throw new Error('Bin is not linked to any user');
  }

  // Get state information for billing amount
  const state = await State.findOne({ code: binRegistration.stateCode });
  if (!state) {
    throw new Error('State not found');
  }

  const billingDate = options.billingDate || new Date();
  const billingPeriod = getBillingPeriod(billingDate);

  // Check if bill already exists for this period
  const existingBill = await Bill.findOne({
    binRegistrationId: binRegistration._id,
    billingPeriod,
  });

  if (existingBill) {
    throw new Error(`Bill already exists for ${billingPeriod}`);
  }

  // Generate bill number
  const billNumber = await generateBillNumber(binRegistration.stateCode);

  // Calculate amount (use state's monthly bill amount or custom amount)
  const amount = options.customAmount || state.monthlyBillAmount || state.averageBill;

  // Calculate due date
  const dueDate = calculateDueDate(billingDate, options.daysUntilDue);

  // Create the bill
  const bill = await Bill.create({
    billNumber,
    binRegistrationId: binRegistration._id,
    userId: binRegistration.userId,
    stateCode: binRegistration.stateCode,
    amount,
    dueDate,
    status: BillStatus.PENDING,
    billingPeriod,
    description: `Waste Management Bill - ${billingPeriod}`,
    metadata: {
      lgaName: binRegistration.lgaName,
      address: binRegistration.address,
    },
  });

  // Create notification for the user
  await Notification.create({
    userId: binRegistration.userId,
    title: 'New Monthly Bill',
    message: `Your waste bin bill for ${billingPeriod} is now available. Amount: ₦${amount.toLocaleString()}. Due date: ${dueDate.toLocaleDateString()}.`,
    type: 'NEW_BILL',
    isRead: false,
    metadata: {
      billId: bill._id,
      billNumber,
      amount,
      dueDate,
      binId: binRegistration.binId,
    },
  });

  return bill;
};

/**
 * Generate bills for all active bins in a state
 */
export const generateMonthlyBillsForState = async (
  stateCode: string,
  options: {
    billingDate?: Date;
    daysUntilDue?: number;
  } = {}
): Promise<{ generated: number; skipped: number; errors: string[] }> => {
  const state = await State.findOne({ code: stateCode });
  if (!state) {
    throw new Error('State not found');
  }

  const billingDate = options.billingDate || new Date();
  const billingPeriod = getBillingPeriod(billingDate);

  // Get all active bin registrations for this state that are linked to users
  const binRegistrations = await BinRegistration.find({
    stateCode,
    isActive: true,
    userId: { $exists: true, $ne: null },
  });

  let generated = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const bin of binRegistrations) {
    try {
      // Check if bill already exists for this period
      const existingBill = await Bill.findOne({
        binRegistrationId: bin._id,
        billingPeriod,
      });

      if (existingBill) {
        skipped++;
        continue;
      }

      await generateBillForBin(bin._id, options);
      generated++;
    } catch (error: any) {
      errors.push(`Bin ${bin.binId}: ${error.message}`);
    }
  }

  return { generated, skipped, errors };
};

/**
 * Generate bills for all states
 */
export const generateMonthlyBillsForAllStates = async (
  options: {
    billingDate?: Date;
    daysUntilDue?: number;
  } = {}
): Promise<Record<string, { generated: number; skipped: number; errors: string[] }>> => {
  const states = await State.find({ isActive: true });
  const results: Record<string, { generated: number; skipped: number; errors: string[] }> = {};

  for (const state of states) {
    try {
      results[state.code] = await generateMonthlyBillsForState(state.code, options);
    } catch (error: any) {
      results[state.code] = {
        generated: 0,
        skipped: 0,
        errors: [error.message],
      };
    }
  }

  return results;
};

/**
 * Update overdue bills
 */
export const updateOverdueBills = async (): Promise<number> => {
  const now = new Date();
  
  const result = await Bill.updateMany(
    {
      status: BillStatus.PENDING,
      dueDate: { $lt: now },
    },
    {
      $set: { status: BillStatus.OVERDUE },
    }
  );

  return result.modifiedCount;
};
