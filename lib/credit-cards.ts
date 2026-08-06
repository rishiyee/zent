export type MinimumPaymentType = "fixed" | "percent"

export type CreditCard = {
  id: string
  accountId: string
  name: string
  balance: number
  creditLimit: number
  apr: number | null
  statementDay: number
  paymentDueDay: number
  minimumPaymentType: MinimumPaymentType
  minimumPaymentValue: number
  autopay: boolean
}

export type CreditCardPayment = {
  id: string
  creditCardId: string
  amount: number
  paidOn: string
  sourceAccountId: string | null
  notes: string
}

export type DueStatus = "ok" | "soon" | "urgent" | "overdue"

/** Next calendar occurrence of `day` on/after `today` (clamped to the month's last day). */
function nextOccurrence(day: number, today: Date): Date {
  const clampToMonth = (year: number, month: number) => {
    const lastDay = new Date(year, month + 1, 0).getDate()
    return new Date(year, month, Math.min(day, lastDay))
  }

  const thisMonth = clampToMonth(today.getFullYear(), today.getMonth())
  if (thisMonth >= startOfDay(today)) return thisMonth
  return clampToMonth(today.getFullYear(), today.getMonth() + 1)
}

/** Most recent occurrence of `day` on/before `today`. */
function mostRecentOccurrence(day: number, today: Date): Date {
  const clampToMonth = (year: number, month: number) => {
    const lastDay = new Date(year, month + 1, 0).getDate()
    return new Date(year, month, Math.min(day, lastDay))
  }

  const thisMonth = clampToMonth(today.getFullYear(), today.getMonth())
  if (thisMonth <= startOfDay(today)) return thisMonth
  return clampToMonth(today.getFullYear(), today.getMonth() - 1)
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

export function nextDueDate(card: CreditCard, today: Date): Date {
  return nextOccurrence(card.paymentDueDay, today)
}

export function lastStatementClose(card: CreditCard, today: Date): Date {
  return mostRecentOccurrence(card.statementDay, today)
}

export function daysUntilDue(card: CreditCard, today: Date): number {
  const due = nextDueDate(card, today)
  const diffMs = due.getTime() - startOfDay(today).getTime()
  return Math.round(diffMs / (1000 * 60 * 60 * 24))
}

export function isCycleSettled(
  card: CreditCard,
  payments: CreditCardPayment[],
  today: Date
): boolean {
  const close = lastStatementClose(card, today)
  return payments.some(
    (p) => p.creditCardId === card.id && new Date(`${p.paidOn}T00:00:00`) >= close
  )
}

export function dueStatus(daysUntil: number, settled: boolean): DueStatus {
  if (settled) return "ok"
  if (daysUntil < 0) return "overdue"
  if (daysUntil <= 2) return "urgent"
  if (daysUntil <= 7) return "soon"
  return "ok"
}

export const dueStatusMeta: Record<
  DueStatus,
  { label: string; className: string }
> = {
  ok: {
    label: "On track",
    className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-transparent",
  },
  soon: {
    label: "Due soon",
    className: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-transparent",
  },
  urgent: {
    label: "Due very soon",
    className: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-transparent",
  },
  overdue: {
    label: "Overdue",
    className: "bg-destructive/10 text-destructive border-transparent",
  },
}

export function utilization(card: CreditCard): number {
  if (card.creditLimit <= 0) return 0
  return Math.min(card.balance / card.creditLimit, 1)
}

export function minimumPaymentAmount(card: CreditCard): number {
  if (card.minimumPaymentType === "fixed") return card.minimumPaymentValue
  return Math.round(card.balance * (card.minimumPaymentValue / 100) * 100) / 100
}
