export type AccountSource = "manual" | "connected"
export type AccountKind = "asset" | "liability"

export type AccountCategory =
  | "checking"
  | "savings"
  | "investment"
  | "credit-card"
  | "loan"
  | "real-estate"
  | "vehicle"
  | "jewelry"
  | "art-collectibles"
  | "business-equity"
  | "precious-metals"
  | "other"

export type Account = {
  id: string
  name: string
  category: AccountCategory
  source: AccountSource
  balance: number
  lastUpdated: string
}

export const categoryMeta: Record<
  AccountCategory,
  { label: string; kind: AccountKind; group: "Cash & Credit" | "Valuables" }
> = {
  checking: { label: "Checking", kind: "asset", group: "Cash & Credit" },
  savings: { label: "Savings", kind: "asset", group: "Cash & Credit" },
  investment: { label: "Investment", kind: "asset", group: "Cash & Credit" },
  "credit-card": {
    label: "Credit Card",
    kind: "liability",
    group: "Cash & Credit",
  },
  loan: { label: "Loan", kind: "liability", group: "Cash & Credit" },
  "real-estate": { label: "Real Estate", kind: "asset", group: "Valuables" },
  vehicle: { label: "Vehicle", kind: "asset", group: "Valuables" },
  jewelry: { label: "Jewelry", kind: "asset", group: "Valuables" },
  "art-collectibles": {
    label: "Art & Collectibles",
    kind: "asset",
    group: "Valuables",
  },
  "business-equity": {
    label: "Business Equity",
    kind: "asset",
    group: "Valuables",
  },
  "precious-metals": {
    label: "Precious Metals",
    kind: "asset",
    group: "Valuables",
  },
  other: { label: "Other", kind: "asset", group: "Valuables" },
}

export const cashCreditCategories: AccountCategory[] = [
  "checking",
  "savings",
  "investment",
  "credit-card",
  "loan",
]

export const valuableCategories: AccountCategory[] = [
  "real-estate",
  "vehicle",
  "jewelry",
  "art-collectibles",
  "business-equity",
  "precious-metals",
  "other",
]

/**
 * Signed balance change for a transaction against an account of the given category.
 * Asset accounts: income adds, expense subtracts. Liability accounts (credit cards,
 * loans) are inverted — an expense increases what's owed, income/refund reduces it.
 */
export function balanceDelta(
  category: AccountCategory,
  type: "income" | "expense",
  amount: number
): number {
  const signed = type === "income" ? amount : -amount
  return categoryMeta[category].kind === "liability" ? -signed : signed
}

export function netWorthSummary(data: Account[]) {
  const assetAccounts = data.filter(
    (a) => categoryMeta[a.category].kind === "asset"
  )
  const liabilityAccounts = data.filter(
    (a) => categoryMeta[a.category].kind === "liability"
  )
  const assets = assetAccounts.reduce((sum, a) => sum + a.balance, 0)
  const liabilities = liabilityAccounts.reduce((sum, a) => sum + a.balance, 0)

  return {
    assets,
    liabilities,
    netWorth: assets - liabilities,
    assetCount: assetAccounts.length,
    liabilityCount: liabilityAccounts.length,
  }
}
