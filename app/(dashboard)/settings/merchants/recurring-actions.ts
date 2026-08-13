"use server"

import { revalidatePath } from "next/cache"

import { toDbAccountId } from "@/lib/data/transactions"
import { merchantKey, RecurringScheduleInput } from "@/lib/recurring"
import { createClient } from "@/lib/supabase/server"

const CADENCES = new Set(["weekly", "biweekly", "monthly", "quarterly", "yearly"])

async function authenticatedClient() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) throw new Error("Unauthorized")
  return supabase
}

function revalidateRecurring() {
  revalidatePath("/settings/merchants")
  revalidatePath("/transactions")
  revalidatePath("/accounts")
  revalidatePath("/")
}

function scheduleRow(input: RecurringScheduleInput) {
  if (!input.merchantName.trim()) throw new Error("Merchant is required")
  if (!Number.isFinite(input.amount) || input.amount <= 0) throw new Error("Amount must be greater than zero")
  if (!CADENCES.has(input.cadence)) throw new Error("Unsupported recurrence")
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.nextDate)) throw new Error("A valid next date is required")
  return {
    merchant_name: input.merchantName.trim(),
    transaction_type: input.transactionType,
    amount: input.amount,
    account_id: toDbAccountId(input.accountId),
    category: input.category,
    cadence: input.cadence,
    next_date: input.nextDate,
    status: input.status,
    updated_at: new Date().toISOString(),
  }
}

export async function createRecurringSchedule(input: RecurringScheduleInput) {
  const supabase = await authenticatedClient()
  const { error } = await supabase.from("recurring_schedules").insert(scheduleRow(input))
  if (error) throw error
  revalidateRecurring()
}

export async function updateRecurringSchedule(id: string, input: RecurringScheduleInput) {
  const supabase = await authenticatedClient()
  const { error } = await supabase.from("recurring_schedules").update(scheduleRow(input)).eq("id", id)
  if (error) throw error
  revalidateRecurring()
}

export async function setRecurringScheduleStatus(id: string, status: "active" | "paused") {
  if (status !== "active" && status !== "paused") throw new Error("Invalid schedule status")
  const supabase = await authenticatedClient()
  const { error } = await supabase.from("recurring_schedules").update({ status, updated_at: new Date().toISOString() }).eq("id", id)
  if (error) throw error
  revalidateRecurring()
}

export async function deleteRecurringSchedule(id: string) {
  const supabase = await authenticatedClient()
  const { error } = await supabase.from("recurring_schedules").delete().eq("id", id)
  if (error) throw error
  revalidateRecurring()
}

export async function dismissRecurringSuggestion(name: string, transactionType: "income" | "expense") {
  const supabase = await authenticatedClient()
  const { error } = await supabase.from("recurring_suggestion_dismissals").upsert({
    merchant_key: merchantKey(name),
    transaction_type: transactionType,
  })
  if (error) throw error
  revalidateRecurring()
}

export async function materializeRecurringSchedules(today: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(today)) throw new Error("Invalid local date")
  const supabase = await authenticatedClient()
  const { data, error } = await supabase.rpc("materialize_due_recurring_schedules", {
    p_today: today,
    p_limit_per_schedule: 24,
  })
  if (error) throw error
  if (Number(data) > 0) revalidateRecurring()
  return Number(data)
}
