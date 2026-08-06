"use server"

import { revalidatePath } from "next/cache"

import { toDbAccountId } from "@/lib/data/transactions"
import { createClient } from "@/lib/supabase/server"
import { Transaction, TransactionStatus } from "@/lib/transactions"

function revalidateTransactions() {
  revalidatePath("/transactions")
  revalidatePath("/")
}

export async function addTransaction(transaction: Omit<Transaction, "id">) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("transactions")
    .insert({
      date: transaction.date,
      description: transaction.description,
      category: transaction.category,
      account_id: toDbAccountId(transaction.accountId),
      type: transaction.type,
      amount: transaction.amount,
      status: transaction.status,
      source: transaction.source,
      notes: transaction.notes ?? null,
      goal_id: transaction.goalId,
    })
    .select("id")
    .single()

  if (error) throw error

  if (transaction.tagIds.length) {
    const { error: tagError } = await supabase.from("transaction_tags").insert(
      transaction.tagIds.map((tagId) => ({ transaction_id: data.id, tag_id: tagId }))
    )
    if (tagError) throw tagError
  }

  revalidateTransactions()
}

export async function updateTransaction(id: string, patch: Partial<Transaction>) {
  const supabase = await createClient()

  const dbPatch: Record<string, unknown> = {}
  if (patch.date !== undefined) dbPatch.date = patch.date
  if (patch.description !== undefined) dbPatch.description = patch.description
  if (patch.category !== undefined) dbPatch.category = patch.category
  if (patch.accountId !== undefined) dbPatch.account_id = toDbAccountId(patch.accountId)
  if (patch.type !== undefined) dbPatch.type = patch.type
  if (patch.amount !== undefined) dbPatch.amount = patch.amount
  if (patch.status !== undefined) dbPatch.status = patch.status
  if (patch.source !== undefined) dbPatch.source = patch.source
  if (patch.notes !== undefined) dbPatch.notes = patch.notes ?? null
  if (patch.goalId !== undefined) dbPatch.goal_id = patch.goalId

  if (Object.keys(dbPatch).length) {
    const { error } = await supabase.from("transactions").update(dbPatch).eq("id", id)
    if (error) throw error
  }

  if (patch.tagIds !== undefined) {
    const { error: clearError } = await supabase
      .from("transaction_tags")
      .delete()
      .eq("transaction_id", id)
    if (clearError) throw clearError

    if (patch.tagIds.length) {
      const { error: tagError } = await supabase
        .from("transaction_tags")
        .insert(patch.tagIds.map((tagId) => ({ transaction_id: id, tag_id: tagId })))
      if (tagError) throw tagError
    }
  }

  revalidateTransactions()
}

export async function deleteTransaction(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from("transactions").delete().eq("id", id)
  if (error) throw error
  revalidateTransactions()
}

export async function bulkUpdateTransactions(
  ids: string[],
  patch: Partial<Pick<Transaction, "category" | "status" | "accountId">>
) {
  const supabase = await createClient()

  const dbPatch: Record<string, unknown> = {}
  if (patch.category !== undefined) dbPatch.category = patch.category
  if (patch.status !== undefined) dbPatch.status = patch.status
  if (patch.accountId !== undefined) dbPatch.account_id = toDbAccountId(patch.accountId)

  if (Object.keys(dbPatch).length) {
    const { error } = await supabase.from("transactions").update(dbPatch).in("id", ids)
    if (error) throw error
  }

  revalidateTransactions()
}

export type SplitInput = {
  amount: number
  category: string | null
  goalId: string | null
  tagIds: string[]
  status: TransactionStatus | null
  notes: string
  hidden: boolean
}

export async function splitTransaction(originalId: string, splits: SplitInput[]) {
  const supabase = await createClient()
  const { error } = await supabase.rpc("split_transaction", {
    p_transaction_id: originalId,
    p_splits: splits.map((split) => ({
      amount: split.amount,
      category: split.category,
      goal_id: split.goalId,
      tag_ids: split.tagIds,
      status: split.status,
      notes: split.notes,
      hidden: split.hidden,
    })),
  })
  if (error) throw error
  revalidateTransactions()
}

export type ImportRow = {
  date: string
  description: string
  amount: number
  type: "income" | "expense"
  category: string | null
}

export async function importTransactions(
  rows: ImportRow[],
  accountId: string,
  adjustBalance: boolean
) {
  if (!rows.length) return 0

  const supabase = await createClient()
  const dbAccountId = toDbAccountId(accountId)

  const { error } = await supabase.from("transactions").insert(
    rows.map((row) => ({
      date: row.date,
      description: row.description,
      category: row.category,
      account_id: dbAccountId,
      type: row.type,
      amount: row.amount,
      status: "needs-review" as const,
      source: "manual" as const,
    }))
  )
  if (error) throw error

  if (adjustBalance && dbAccountId) {
    const delta = rows.reduce(
      (sum, row) => sum + (row.type === "income" ? row.amount : -row.amount),
      0
    )
    const { data: account, error: fetchError } = await supabase
      .from("accounts")
      .select("balance")
      .eq("id", dbAccountId)
      .single()
    if (fetchError) throw fetchError

    const { error: updateError } = await supabase
      .from("accounts")
      .update({
        balance: Number(account.balance) + delta,
        last_updated: new Date().toISOString().slice(0, 10),
      })
      .eq("id", dbAccountId)
    if (updateError) throw updateError
    revalidatePath("/accounts")
  }

  revalidateTransactions()
  return rows.length
}
