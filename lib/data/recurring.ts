import { createClient } from "@/lib/supabase/server"
import { merchantKey, RecurringSchedule } from "@/lib/recurring"

type ScheduleRow = {
  id: string
  merchant_name: string
  transaction_type: RecurringSchedule["transactionType"]
  amount: number
  account_id: string | null
  category: string | null
  cadence: RecurringSchedule["cadence"]
  next_date: string
  status: RecurringSchedule["status"]
}

export function toRecurringSchedule(row: ScheduleRow): RecurringSchedule {
  return {
    id: row.id,
    merchantName: row.merchant_name,
    transactionType: row.transaction_type,
    amount: Number(row.amount),
    accountId: row.account_id ?? "CASH",
    category: row.category,
    cadence: row.cadence,
    nextDate: row.next_date,
    status: row.status,
  }
}

export async function getRecurringSchedules() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("recurring_schedules")
    .select("id, merchant_name, transaction_type, amount, account_id, category, cadence, next_date, status")
    .order("next_date")
  if (error) throw error
  return (data as ScheduleRow[]).map(toRecurringSchedule)
}

export async function getRecurringDismissals() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("recurring_suggestion_dismissals")
    .select("merchant_key, transaction_type")
  if (error) throw error
  return new Set((data ?? []).map((row) => `${merchantKey(row.merchant_key)}:${row.transaction_type}`))
}
