import { BinRegistration } from '../models';

/**
 * Generates a unique bin ID for a given state code
 * Format: <STATE_CODE><6-digit-number>
 * Example: LA000001, EN000123, FC005678
 */
export async function generateBinId(stateCode: string): Promise<string> {
  // Get the count of existing bins for this state to determine the next number
  const existingBinsCount = await BinRegistration.countDocuments({ stateCode });
  
  // Start from the next number
  let nextNumber = existingBinsCount + 1;
  let binId = '';
  let attempts = 0;
  const maxAttempts = 100;

  // Try to generate a unique bin ID
  while (attempts < maxAttempts) {
    // Format: STATE_CODE + 6-digit number (padded with zeros)
    binId = `${stateCode.toUpperCase()}${nextNumber.toString().padStart(6, '0')}`;
    
    // Check if this bin ID already exists
    const existing = await BinRegistration.findOne({ binId });
    
    if (!existing) {
      return binId;
    }
    
    // If exists, try the next number
    nextNumber++;
    attempts++;
  }

  // Fallback: use timestamp if all attempts failed
  const timestamp = Date.now().toString().slice(-6);
  binId = `${stateCode.toUpperCase()}${timestamp}`;
  
  // Final check
  const existing = await BinRegistration.findOne({ binId });
  if (existing) {
    throw new Error('Unable to generate unique bin ID');
  }

  return binId;
}

/**
 * Validates if a bin ID matches the expected format for a state
 * Format: <STATE_CODE><6-digits>
 */
export function validateBinIdFormat(binId: string, stateCode: string): boolean {
  const pattern = new RegExp(`^${stateCode.toUpperCase()}\\d{6}$`);
  return pattern.test(binId);
}
