import { createClient } from "@/lib/supabase/server"
import { Account } from "@/lib/accounts"

type AccountRow = {
  id: string
  name: string
  category: Account["category"]
  source: Account["source"]
  balance: number
  last_updated: string
}

function toAccount(row: AccountRow): Account {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    source: row.source,
    balance: Number(row.balance),
    lastUpdated: row.last_updated,
  }
}

export async function getAccounts(): Promise<Account[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("accounts")
    .select("id, name, category, source, balance, last_updated")
    .order("created_at", { ascending: true })

  if (error) throw error
  return (data as AccountRow[]).map(toAccount)
}
