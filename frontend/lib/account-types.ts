export type AccountType = "INDIVIDUAL" | "SCHOOL" | "INDUSTRY" | "INSTITUTION";

export const ACCOUNT_TYPES: {
  value: AccountType;
  label: string;
  amount: number;
}[] = [
  { value: "INDIVIDUAL", label: "Individual", amount: 1500 },
  { value: "SCHOOL", label: "School", amount: 2000 },
  { value: "INDUSTRY", label: "Industry", amount: 5000 },
  { value: "INSTITUTION", label: "Institution", amount: 3000 },
];

export const isOrganizationType = (type: AccountType) => type !== "INDIVIDUAL";

// Keep in sync with backend/src/utils/accountTypes.ts.
export const ORGANIZATION_CATEGORIES: Record<
  Exclude<AccountType, "INDIVIDUAL">,
  { value: string; label: string }[]
> = {
  SCHOOL: [
    { value: "NURSERY", label: "Nursery" },
    { value: "PRIMARY", label: "Primary" },
    { value: "SECONDARY", label: "Secondary" },
    { value: "TERTIARY", label: "Tertiary" },
    { value: "VOCATIONAL", label: "Vocational" },
  ],
  INDUSTRY: [
    { value: "MANUFACTURING", label: "Manufacturing" },
    { value: "FOOD_PROCESSING", label: "Food processing" },
    { value: "OIL_AND_GAS", label: "Oil and gas" },
    { value: "CONSTRUCTION", label: "Construction" },
    { value: "AGRICULTURE", label: "Agriculture" },
    { value: "MINING", label: "Mining" },
    { value: "OTHER", label: "Other" },
  ],
  INSTITUTION: [
    { value: "HEALTHCARE", label: "Healthcare" },
    { value: "RELIGIOUS", label: "Religious" },
    { value: "GOVERNMENT", label: "Government" },
    { value: "NGO", label: "NGO" },
    { value: "FINANCIAL", label: "Financial" },
    { value: "OTHER", label: "Other" },
  ],
};

export const CATEGORY_FIELD_LABEL: Record<
  Exclude<AccountType, "INDIVIDUAL">,
  string
> = {
  SCHOOL: "School level",
  INDUSTRY: "Industry sector",
  INSTITUTION: "Institution type",
};
