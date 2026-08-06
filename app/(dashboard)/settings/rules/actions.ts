"use server"

import { revalidatePath } from "next/cache"

import { createClient } from "@/lib/supabase/server"
import { matchRule } from "@/lib/transactions"

function revalidateRules() {
  revalidatePath("/settings/rules")
  revalidatePath("/transactions")
  revalidatePath("/")
}

export async function addRule(keyword: string, category: string) {
  const supabase = await createClient()
  const { count, error: countError } = await supabase
    .from("category_rules")
    .select("id", { count: "exact", head: true })
  if (countError) throw countError

  const { error } = await supabase
    .from("category_rules")
    .insert({ keyword, category, enabled: true, sort_order: count ?? 0 })
  if (error) throw error
  revalidateRules()
}

export async function toggleRule(id: string, enabled: boolean) {
  const supabase = await createClient()
  const { error } = await supabase.from("category_rules").update({ enabled }).eq("id", id)
  if (error) throw error
  revalidateRules()
}

export async function deleteRule(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from("category_rules").delete().eq("id", id)
  if (error) throw error
  revalidateRules()
}

export async function reorderRules(orderedIds: string[]) {
  const supabase = await createClient()
  const updates = orderedIds.map((id, index) =>
    supabase.from("category_rules").update({ sort_order: index }).eq("id", id)
  )
  const results = await Promise.all(updates)
  const failed = results.find((result) => result.error)
  if (failed?.error) throw failed.error
  revalidateRules()
}

export async function applyRules() {
  const supabase = await createClient()
  const [{ data: rules, error: rulesError }, { data: txns, error: txnError }] =
    await Promise.all([
      supabase.from("category_rules").select("id, keyword, category, enabled"),
      supabase.from("transactions").select("id, description").is("category", null),
    ])
  if (rulesError) throw rulesError
  if (txnError) throw txnError

  const enabledRules = (rules ?? []).filter((rule) => rule.enabled)
  let count = 0

  for (const txn of txns ?? []) {
    const rule = matchRule(txn.description, enabledRules)
    if (!rule) continue
    const { error } = await supabase
      .from("transactions")
      .update({ category: rule.category, status: "reviewed" })
      .eq("id", txn.id)
    if (error) throw error
    count += 1
  }

  revalidateRules()
  return count
}
