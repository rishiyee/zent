"use server"

import { revalidatePath } from "next/cache"

import { getAccounts } from "@/lib/data/accounts"
import { Account } from "@/lib/accounts"
import { createClient } from "@/lib/supabase/server"

export async function getAccountsData() {
  return getAccounts()
}

export async function addAccount(account: Omit<Account, "id">) {
  const supabase = await createClient()
  const { error } = await supabase.from("accounts").insert({
    name: account.name,
    category: account.category,
    source: account.source,
    balance: account.balance,
    last_updated: account.lastUpdated,
  })
  if (error) throw error
  revalidatePath("/accounts")
  revalidatePath("/transactions")
  revalidatePath("/")
}

export async function updateAccount(
  id: string,
  patch: Partial<Omit<Account, "id">>
) {
  const supabase = await createClient()

  const dbPatch: Record<string, unknown> = {}
  if (patch.name !== undefined) dbPatch.name = patch.name
  if (patch.category !== undefined) dbPatch.category = patch.category
  if (patch.source !== undefined) dbPatch.source = patch.source
  if (patch.balance !== undefined) dbPatch.balance = patch.balance
  if (patch.lastUpdated !== undefined) dbPatch.last_updated = patch.lastUpdated

  if (Object.keys(dbPatch).length) {
    const { error } = await supabase.from("accounts").update(dbPatch).eq("id", id)
    if (error) throw error
  }

  revalidatePath("/accounts")
  revalidatePath("/transactions")
  revalidatePath("/")
}

export async function deleteAccount(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from("accounts").delete().eq("id", id)
  if (error) throw error
  revalidatePath("/accounts")
  revalidatePath("/transactions")
  revalidatePath("/")
}
