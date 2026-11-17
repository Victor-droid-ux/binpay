export enum AccountType {
  INDIVIDUAL = "INDIVIDUAL",
  SCHOOL = "SCHOOL",
  INDUSTRY = "INDUSTRY",
  INSTITUTION = "INSTITUTION",
}

export enum ApprovalStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
}

// Flat monthly bill (NGN) per account type, identical in every state.
export const ACCOUNT_TYPE_RATES: Record<AccountType, number> = {
  [AccountType.INDIVIDUAL]: 1500,
  [AccountType.SCHOOL]: 2000,
  [AccountType.INDUSTRY]: 5000,
  [AccountType.INSTITUTION]: 3000,
};

export const getAccountTypeRate = (accountType?: string): number =>
  ACCOUNT_TYPE_RATES[accountType as AccountType] ??
  ACCOUNT_TYPE_RATES[AccountType.INDIVIDUAL];

export const isOrganizationType = (accountType?: string): boolean =>
  !!accountType && accountType !== AccountType.INDIVIDUAL;

// Keep in sync with frontend/lib/account-types.ts.
export const ORGANIZATION_CATEGORIES: Record<string, string[]> = {
  [AccountType.SCHOOL]: [
    "NURSERY",
    "PRIMARY",
    "SECONDARY",
    "TERTIARY",
    "VOCATIONAL",
  ],
  [AccountType.INDUSTRY]: [
    "MANUFACTURING",
    "FOOD_PROCESSING",
    "OIL_AND_GAS",
    "CONSTRUCTION",
    "AGRICULTURE",
    "MINING",
    "OTHER",
  ],
  [AccountType.INSTITUTION]: [
    "HEALTHCARE",
    "RELIGIOUS",
    "GOVERNMENT",
    "NGO",
    "FINANCIAL",
    "OTHER",
  ],
};
