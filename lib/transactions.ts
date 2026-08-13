export type TransactionType = "income" | "expense"
export type TransactionStatus = "needs-review" | "pending" | "reviewed"
export type TransactionSource = "synced" | "manual"

export type Transaction = {
  id: string
  date: string
  description: string
  category: string | null
  accountId: string
  type: TransactionType
  amount: number
  status: TransactionStatus
  source: TransactionSource
  notes?: string
  goalId: string | null
  tagIds: string[]
  linkedPaymentId?: string | null
  transferToAccountId: string | null
  recurringScheduleId?: string | null
  recurringOccurrenceDate?: string | null
}

export type CategoryRule = {
  id: string
  keyword: string
  category: string
  enabled: boolean
}

export const UNCATEGORIZED = "uncategorized"

export const statuses: TransactionStatus[] = [
  "needs-review",
  "pending",
  "reviewed",
]

export const statusMeta: Record<
  TransactionStatus,
  { label: string; className: string }
> = {
  "needs-review": {
    label: "Needs review",
    className:
      "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-transparent",
  },
  pending: {
    label: "Pending",
    className:
      "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-transparent",
  },
  reviewed: {
    label: "Reviewed",
    className:
      "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-transparent",
  },
}

export type TransactionAccountOption = { id: string; name: string }

export function transactionAccountOptions(
  accounts: TransactionAccountOption[]
): TransactionAccountOption[] {
  return [...accounts, { id: "CASH", name: "Cash / Untracked" }]
}

export function accountName(
  accountId: string,
  accounts: TransactionAccountOption[]
) {
  return (
    transactionAccountOptions(accounts).find(
      (account) => account.id === accountId
    )?.name ?? accountId
  )
}

export function matchRule(description: string, rules: CategoryRule[]) {
  const value = description.toLowerCase()
  return (
    rules.find(
      (rule) => rule.enabled && value.includes(rule.keyword.toLowerCase())
    ) ?? null
  )
}

export type DailyCashFlow = {
  date: string
  income: number
  expense: number
}

export function dailyCashFlow(data: Transaction[]): DailyCashFlow[] {
  const byDate = new Map<string, DailyCashFlow>()

  for (const t of data) {
    if (t.linkedPaymentId || t.transferToAccountId) continue
    const entry = byDate.get(t.date) ?? { date: t.date, income: 0, expense: 0 }
    if (t.type === "income") {
      entry.income += t.amount
    } else {
      entry.expense += t.amount
    }
    byDate.set(t.date, entry)
  }

  return Array.from(byDate.values()).sort((a, b) =>
    a.date.localeCompare(b.date)
  )
}

export type DailyGroup = {
  date: string
  transactions: Transaction[]
  net: number
}

export function groupByDate(list: Transaction[]): DailyGroup[] {
  const byDate = new Map<string, Transaction[]>()
  for (const txn of list) {
    const bucket = byDate.get(txn.date)
    if (bucket) bucket.push(txn)
    else byDate.set(txn.date, [txn])
  }

  return Array.from(byDate.entries())
    .sort(([a], [b]) => (a < b ? 1 : -1))
    .map(([date, items]) => ({
      date,
      transactions: items,
      net: items.reduce(
        (sum, txn) =>
          txn.linkedPaymentId || txn.transferToAccountId
            ? sum
            : sum + (txn.type === "income" ? txn.amount : -txn.amount),
        0
      ),
    }))
}
