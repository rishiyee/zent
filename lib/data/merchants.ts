import { createClient } from "@/lib/supabase/server"
import { merchantKey } from "@/lib/recurring"

export type Merchant = {
  name: string
  count: number
}

export async function getMerchants(): Promise<Merchant[]> {
  const supabase = await createClient()
  const [{ data, error }, { data: hidden, error: hiddenError }] = await Promise.all([
    supabase.from("transactions").select("description"),
    supabase.from("hidden_merchants").select("merchant_key"),
  ])
  if (error) throw error
  if (hiddenError) throw hiddenError

  const hiddenKeys = new Set((hidden ?? []).map((row) => row.merchant_key))
  const counts = new Map<string, number>()
  for (const row of data ?? []) {
    if (!row.description.trim()) continue
    if (hiddenKeys.has(merchantKey(row.description))) continue
    counts.set(row.description, (counts.get(row.description) ?? 0) + 1)
  }

  return Array.from(counts, ([name, count]) => ({ name, count })).sort(
    (a, b) => b.count - a.count
  )
}
