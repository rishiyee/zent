import { createClient } from "@/lib/supabase/server"
import { CategoryRule, Transaction } from "@/lib/transactions"

type TransactionRow = {
  id: string
  date: string
  description: string
  category: string | null
  account_id: string | null
  type: Transaction["type"]
  amount: number
  status: Transaction["status"]
  source: Transaction["source"]
  notes: string | null
  goal_id: string | null
  transaction_tags: { tag_id: string }[] | null
}

function toTransaction(row: TransactionRow): Transaction {
  return {
    id: row.id,
    date: row.date,
    description: row.description,
    category: row.category,
    accountId: row.account_id ?? "CASH",
    type: row.type,
    amount: Number(row.amount),
    status: row.status,
    source: row.source,
    notes: row.notes ?? undefined,
    goalId: row.goal_id,
    tagIds: (row.transaction_tags ?? []).map((t) => t.tag_id),
    linkedPaymentId:
      row.category === "Credit card payment" ? "credit-card-payment" : null,
  }
}

export async function getTransactions(): Promise<Transaction[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("transactions")
    .select("*, transaction_tags(tag_id)")
    .order("date", { ascending: false })

  if (error) throw error
  return (data as TransactionRow[]).map(toTransaction)
}

export async function getCategoryRules(): Promise<CategoryRule[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("category_rules")
    .select("id, keyword, category, enabled")
    .order("sort_order", { ascending: true })

  if (error) throw error
  return data as CategoryRule[]
}

/** Maps the UI's synthetic "CASH" account id back to the null FK the DB expects. */
export function toDbAccountId(accountId: string): string | null {
  return accountId === "CASH" ? null : accountId
}
