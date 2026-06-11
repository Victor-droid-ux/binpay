import { BinRegistration, State } from "../models";
import { randomInt } from "crypto";

interface BinIdPattern {
  prefix: string;
  tokenLength: number;
}

function resolveBinIdPattern(
  stateCode: string,
  binIdFormat?: string,
): BinIdPattern {
  const fallbackPrefix = stateCode.trim().slice(0, 2).toUpperCase() || "BN";

  if (!binIdFormat) {
    return { prefix: fallbackPrefix, tokenLength: 6 };
  }

  const format = binIdFormat.trim().toUpperCase();
  const firstHashIndex = format.indexOf("#");

  if (firstHashIndex === -1) {
    return { prefix: format || fallbackPrefix, tokenLength: 6 };
  }

  const prefix = format.slice(0, firstHashIndex) || fallbackPrefix;
  const tokenLength = (format.match(/#/g) || []).length || 6;

  return { prefix, tokenLength };
}

function randomAlphaNumeric(length: number): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let output = "";

  for (let i = 0; i < length; i++) {
    output += alphabet[randomInt(0, alphabet.length)];
  }

  return output;
}

/**
 * Generates a unique bin ID using the state's configured `binIdFormat`.
 * Example format in state config: LA###### -> LAA3F7K, LAB9X2M, ...
 */
export async function generateBinId(stateCode: string): Promise<string> {
  const normalizedStateCode = stateCode.trim();
  const state = await State.findOne({ code: normalizedStateCode }).select(
    "binIdFormat",
  );
  const { prefix, tokenLength } = resolveBinIdPattern(
    normalizedStateCode,
    state?.binIdFormat,
  );
  let binId = "";
  let attempts = 0;
  const maxAttempts = 200;

  // Try to generate a unique bin ID
  while (attempts < maxAttempts) {
    // Format: PREFIX + random alphanumeric token
    binId = `${prefix}${randomAlphaNumeric(tokenLength)}`;

    // Check if this bin ID already exists
    const existing = await BinRegistration.findOne({ binId });

    if (!existing) {
      return binId;
    }

    // If exists, generate a new random token
    attempts++;
  }

  throw new Error("Unable to generate unique bin ID");
}

/**
 * Validates if a bin ID matches the expected fallback format for a state.
 * Fallback format: <2-letter-state-prefix><6 alphanumeric chars>
 */
export function validateBinIdFormat(binId: string, stateCode: string): boolean {
  const prefix = stateCode.trim().slice(0, 2).toUpperCase() || "BN";
  const pattern = new RegExp(`^${prefix}[A-Z0-9]{6}$`);
  return pattern.test(binId);
}
