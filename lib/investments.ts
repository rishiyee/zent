export type InvestmentAssetType =
  | "stock"
  | "etf"
  | "mutual-fund"
  | "bond"
  | "cryptocurrency"
  | "cash"
  | "other"

export type InvestmentHolding = {
  id: string
  accountId: string
  symbol: string
  name: string
  type: InvestmentAssetType
  price: number
  quantity: number
  costBasis: number | null
  currency: string
  priceUpdatedAt: string
}

export type InvestmentPricePoint = {
  holdingId: string
  valuedOn: string
  price: number
  quantity: number
}

export const investmentAssetLabels: Record<InvestmentAssetType, string> = {
  stock: "Stock",
  etf: "ETF",
  "mutual-fund": "Mutual fund",
  bond: "Bond",
  cryptocurrency: "Cryptocurrency",
  cash: "Cash",
  other: "Other",
}
