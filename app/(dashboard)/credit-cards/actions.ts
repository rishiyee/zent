"use server"

import { revalidatePath } from "next/cache"

import { CreditCard, CreditCardPayment } from "@/lib/credit-cards"
import { createClient } from "@/lib/supabase/server"

function revalidateCreditCards() {
  revalidatePath("/credit-cards")
  revalidatePath("/accounts")
  revalidatePath("/")
}

export async function addCreditCard(
  card: Omit<CreditCard, "id" | "accountId">
) {
  const supabase = await createClient()

  const { data: account, error: accountError } = await supabase
    .from("accounts")
    .insert({
      name: card.name,
      category: "credit-card",
      source: "manual",
      balance: card.balance,
      last_updated: new Date().toISOString().slice(0, 10),
    })
    .select("id")
    .single()
  if (accountError) throw accountError

  const { error: cardError } = await supabase.from("credit_cards").insert({
    account_id: account.id,
    credit_limit: card.creditLimit,
    apr: card.apr,
    statement_day: card.statementDay,
    payment_due_day: card.paymentDueDay,
    minimum_payment_type: card.minimumPaymentType,
    minimum_payment_value: card.minimumPaymentValue,
    autopay: card.autopay,
  })
  if (cardError) {
    await supabase.from("accounts").delete().eq("id", account.id)
    throw cardError
  }

  revalidateCreditCards()
}

export async function updateCreditCard(
  id: string,
  accountId: string,
  patch: Omit<CreditCard, "id" | "accountId">
) {
  const supabase = await createClient()

  const { error: accountError } = await supabase
    .from("accounts")
    .update({
      name: patch.name,
      balance: patch.balance,
      last_updated: new Date().toISOString().slice(0, 10),
    })
    .eq("id", accountId)
  if (accountError) throw accountError

  const { error: cardError } = await supabase
    .from("credit_cards")
    .update({
      credit_limit: patch.creditLimit,
      apr: patch.apr,
      statement_day: patch.statementDay,
      payment_due_day: patch.paymentDueDay,
      minimum_payment_type: patch.minimumPaymentType,
      minimum_payment_value: patch.minimumPaymentValue,
      autopay: patch.autopay,
    })
    .eq("id", id)
  if (cardError) throw cardError

  revalidateCreditCards()
}

export async function deleteCreditCard(accountId: string) {
  const supabase = await createClient()
  const { error } = await supabase.from("accounts").delete().eq("id", accountId)
  if (error) throw error
  revalidateCreditCards()
}

export async function addPayment(payment: Omit<CreditCardPayment, "id">) {
  const supabase = await createClient()
  const { error } = await supabase.from("credit_card_payments").insert({
    credit_card_id: payment.creditCardId,
    source_account_id: payment.sourceAccountId,
    amount: payment.amount,
    paid_on: payment.paidOn,
    notes: payment.notes || null,
  })
  if (error) throw error
  revalidatePath("/credit-cards")
  revalidatePath("/")
}
