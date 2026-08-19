import { createClient } from "@/lib/supabase/server"
import type { InvestmentAssetType, InvestmentHolding, InvestmentPricePoint } from "@/lib/investments"

type HoldingRow = {
  id: string
  account_id: string
  symbol: string
  name: string
  asset_type: InvestmentAssetType
  price: number | string
  quantity: number | string
  cost_basis: number | string | null
  currency: string
  price_updated_at: string
}

type PriceRow = { holding_id: string; valued_on: string; price: number | string; quantity: number | string }

export async function getInvestmentHoldings(): Promise<InvestmentHolding[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("investment_holdings")
    .select("id, account_id, symbol, name, asset_type, price, quantity, cost_basis, currency, price_updated_at")
    .order("created_at", { ascending: true })

  if (error) throw error

  return (data as HoldingRow[]).map((row) => ({
    id: row.id,
    accountId: row.account_id,
    symbol: row.symbol,
    name: row.name,
    type: row.asset_type,
    price: Number(row.price),
    quantity: Number(row.quantity),
    costBasis: row.cost_basis === null ? null : Number(row.cost_basis),
    currency: row.currency,
    priceUpdatedAt: row.price_updated_at,
  }))
}

export async function getInvestmentPriceHistory(): Promise<InvestmentPricePoint[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("investment_price_history")
    .select("holding_id, valued_on, price, quantity")
    .order("valued_on", { ascending: true })

  if (error) throw error
  return (data as PriceRow[]).map((row) => ({
    holdingId: row.holding_id,
    valuedOn: row.valued_on,
    price: Number(row.price),
    quantity: Number(row.quantity),
  }))
}
