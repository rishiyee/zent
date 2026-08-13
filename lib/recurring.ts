import { Transaction } from "@/lib/transactions"

export type RecurringCadence = "weekly" | "biweekly" | "monthly" | "quarterly" | "yearly"
export type RecurringStatus = "active" | "paused"

export type RecurringSchedule = {
  id: string
  merchantName: string
  transactionType: Transaction["type"]
  amount: number
  accountId: string
  category: string | null
  cadence: RecurringCadence
  nextDate: string
  status: RecurringStatus
}

export type RecurringSuggestion = Omit<RecurringSchedule, "id" | "status"> & {
  key: string
  confidence: "high" | "medium"
  occurrences: number
}

export type RecurringScheduleInput = Omit<RecurringSchedule, "id">

export const cadenceLabels: Record<RecurringCadence, string> = {
  weekly: "Weekly",
  biweekly: "Every 2 weeks",
  monthly: "Monthly",
  quarterly: "Quarterly",
  yearly: "Yearly",
}

export function merchantKey(name: string) {
  return name.trim().toLowerCase().replace(/\s+/g, " ")
}

const cadenceWindows: { cadence: RecurringCadence; days: number; tolerance: number }[] = [
  { cadence: "weekly", days: 7, tolerance: 2 },
  { cadence: "biweekly", days: 14, tolerance: 3 },
  { cadence: "monthly", days: 30.44, tolerance: 5 },
  { cadence: "quarterly", days: 91.3, tolerance: 10 },
  { cadence: "yearly", days: 365.25, tolerance: 20 },
]

function addCadence(date: string, cadence: RecurringCadence) {
  const next = new Date(`${date}T12:00:00`)
  if (cadence === "weekly") next.setDate(next.getDate() + 7)
  if (cadence === "biweekly") next.setDate(next.getDate() + 14)
  if (cadence === "monthly") next.setMonth(next.getMonth() + 1)
  if (cadence === "quarterly") next.setMonth(next.getMonth() + 3)
  if (cadence === "yearly") next.setFullYear(next.getFullYear() + 1)
  return next.toISOString().slice(0, 10)
}

export function detectRecurringSuggestions(
  transactions: Transaction[],
  schedules: RecurringSchedule[],
  dismissed: Set<string>
): RecurringSuggestion[] {
  const groups = new Map<string, Transaction[]>()
  for (const transaction of transactions) {
    if (transaction.transferToAccountId || transaction.linkedPaymentId) continue
    const key = `${merchantKey(transaction.description)}:${transaction.type}`
    const list = groups.get(key) ?? []
    list.push(transaction)
    groups.set(key, list)
  }

  const activeKeys = new Set(schedules.map((s) => `${merchantKey(s.merchantName)}:${s.transactionType}`))
  const suggestions: RecurringSuggestion[] = []

  for (const [key, items] of groups) {
    if (items.length < 3 || activeKeys.has(key) || dismissed.has(key)) continue
    const sorted = [...items].sort((a, b) => a.date.localeCompare(b.date))
    const intervals = sorted.slice(1).map((item, index) =>
      (new Date(`${item.date}T12:00:00`).getTime() - new Date(`${sorted[index].date}T12:00:00`).getTime()) / 86_400_000
    )
    const match = cadenceWindows.find((window) =>
      intervals.every((days) => Math.abs(days - window.days) <= window.tolerance)
    )
    if (!match) continue
    const amounts = sorted.map((item) => item.amount).sort((a, b) => a - b)
    const median = amounts[Math.floor(amounts.length / 2)]
    if (!median || sorted.some((item) => Math.abs(item.amount - median) / median > 0.2)) continue
    const latest = sorted[sorted.length - 1]
    suggestions.push({
      key,
      merchantName: latest.description,
      transactionType: latest.type,
      amount: latest.amount,
      accountId: latest.accountId,
      category: latest.category,
      cadence: match.cadence,
      nextDate: addCadence(latest.date, match.cadence),
      confidence: intervals.every((days) => Math.abs(days - match.days) <= Math.max(1, match.tolerance / 2)) ? "high" : "medium",
      occurrences: sorted.length,
    })
  }
  return suggestions.sort((a, b) => a.nextDate.localeCompare(b.nextDate))
}
