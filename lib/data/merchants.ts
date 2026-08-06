import { createClient } from "@/lib/supabase/server"

export type Merchant = {
  name: string
  count: number
}

export async function getMerchants(): Promise<Merchant[]> {
  const supabase = await createClient()
  const { data, error } = await supabase.from("transactions").select("description")
  if (error) throw error

  const counts = new Map<string, number>()
  for (const row of data ?? []) {
    counts.set(row.description, (counts.get(row.description) ?? 0) + 1)
  }

  return Array.from(counts, ([name, count]) => ({ name, count })).sort(
    (a, b) => b.count - a.count
  )
}
