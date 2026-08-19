"use server"

import { revalidatePath } from "next/cache"

import { createClient } from "@/lib/supabase/server"
import { merchantKey } from "@/lib/recurring"

export async function renameMerchant(oldName: string, newName: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from("transactions")
    .update({ description: newName })
    .eq("description", oldName)
  if (error) throw error

  const { error: scheduleError } = await supabase
    .from("recurring_schedules")
    .update({ merchant_name: newName, updated_at: new Date().toISOString() })
    .eq("merchant_name", oldName)
  if (scheduleError) throw scheduleError

  const { data: dismissals, error: dismissalFetchError } = await supabase
    .from("recurring_suggestion_dismissals")
    .select("transaction_type")
    .eq("merchant_key", merchantKey(oldName))
  if (dismissalFetchError) throw dismissalFetchError
  if (dismissals?.length) {
    const { error: dismissalError } = await supabase
      .from("recurring_suggestion_dismissals")
      .upsert(dismissals.map((item) => ({
        merchant_key: merchantKey(newName),
        transaction_type: item.transaction_type,
      })))
    if (dismissalError) throw dismissalError
    await supabase.from("recurring_suggestion_dismissals").delete().eq("merchant_key", merchantKey(oldName))
  }

  revalidatePath("/settings/merchants")
  revalidatePath("/transactions")
  revalidatePath("/")
}

export async function hideMerchant(name: string) {
  const merchantName = name.trim()
  if (!merchantName) throw new Error("Merchant is required")

  const supabase = await createClient()
  const { error } = await supabase.from("hidden_merchants").upsert({
    merchant_key: merchantKey(merchantName),
    merchant_name: merchantName,
  })
  if (error) throw error

  revalidatePath("/", "layout")
  revalidatePath("/settings/merchants")
  revalidatePath("/recurring")
  revalidatePath("/transactions")
}
