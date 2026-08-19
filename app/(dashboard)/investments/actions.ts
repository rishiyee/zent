"use server"

import { revalidatePath } from "next/cache"

import type { InvestmentAssetType } from "@/lib/investments"
import { createClient } from "@/lib/supabase/server"

export type AddHoldingInput = {
  accountId: string
  symbol: string
  name: string
  type: InvestmentAssetType
  price: number
  quantity: number
}

export async function addInvestmentHolding(input: AddHoldingInput) {
  const symbol = input.symbol.trim().toUpperCase()
  const name = input.name.trim()
  if (!input.accountId || !symbol || !name || input.price <= 0 || input.quantity <= 0) {
    throw new Error("Invalid holding details")
  }

  const supabase = await createClient()
  const { data: holding, error } = await supabase.from("investment_holdings").insert({
    account_id: input.accountId,
    symbol,
    name,
    asset_type: input.type,
    price: input.price,
    quantity: input.quantity,
  }).select("id").single()

  if (error) throw error
  const { error: historyError } = await supabase.from("investment_price_history").insert({
    holding_id: holding.id,
    valued_on: new Date().toISOString().slice(0, 10),
    price: input.price,
    quantity: input.quantity,
  })
  if (historyError) throw historyError
  revalidatePath("/investments")
  revalidatePath("/accounts")
  revalidatePath("/")
}
