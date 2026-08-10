"use server"

import { revalidatePath } from "next/cache"

import { getCreditCardPayments, getCreditCards } from "@/lib/data/credit-cards"
import { CreditCard, CreditCardPayment } from "@/lib/credit-cards"
import { createClient } from "@/lib/supabase/server"

export async function getCreditCardsData() {
  const [cards, payments] = await Promise.all([
    getCreditCards(),
    getCreditCardPayments(),
  ])
  return { cards, payments }
}

function revalidateCreditCards() {
  revalidatePath("/credit-cards")
  revalidatePath("/accounts")
  revalidatePath("/transactions")
  revalidatePath("/")
}

async function adjustPaymentSourceBalance(
  supabase: Awaited<ReturnType<typeof createClient>>,
  accountId: string | null,
  delta: number,
  date: string
) {
  if (!accountId || delta === 0) return
  const { data: account, error: fetchError } = await supabase
    .from("accounts")
    .select("balance")
    .eq("id", accountId)
    .single()
  if (fetchError) throw fetchError

  const { error } = await supabase
    .from("accounts")
    .update({
      balance: Number(account.balance) + delta,
      last_updated: date,
    })
    .eq("id", accountId)
  if (error) throw error
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

  if (card.balance > 0) {
    const { error: openingBalanceError } = await supabase.from("transactions").insert({
      date: new Date().toISOString().slice(0, 10),
      description: `Opening balance for ${card.name}`,
      category: "Opening balance",
      account_id: account.id,
      type: "expense",
      amount: card.balance,
      status: "reviewed",
      source: "manual",
    })
    if (openingBalanceError) {
      await supabase.from("accounts").delete().eq("id", account.id)
      throw openingBalanceError
    }
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

  const { data: card, error: cardError } = await supabase
    .from("credit_cards")
    .select("account_id, accounts(name)")
    .eq("id", payment.creditCardId)
    .single()
  if (cardError) throw cardError

  const { data: account, error: accountError } = await supabase
    .from("accounts")
    .select("balance")
    .eq("id", card.account_id)
    .single()
  if (accountError) throw accountError

  const cardAccount = card.accounts as unknown as { name: string } | null
  const { data: ledgerTransaction, error: transactionError } = await supabase
    .from("transactions")
    .insert({
      date: payment.paidOn,
      description: `Payment to ${cardAccount?.name ?? "credit card"}`,
      category: "Credit card payment",
      account_id: payment.sourceAccountId,
      type: "expense",
      amount: payment.amount,
      status: "reviewed",
      source: "manual",
      notes: payment.notes || null,
    })
    .select("id")
    .single()
  if (transactionError) throw transactionError

  const { data: recordedPayment, error: paymentError } = await supabase
    .from("credit_card_payments")
    .insert({
      credit_card_id: payment.creditCardId,
      source_account_id: payment.sourceAccountId,
      amount: payment.amount,
      paid_on: payment.paidOn,
      notes: payment.notes || null,
      transaction_id: ledgerTransaction.id,
    })
    .select("id")
    .single()
  if (paymentError) {
    await supabase.from("transactions").delete().eq("id", ledgerTransaction.id)
    throw paymentError
  }

  const nextBalance = Math.max(0, Number(account.balance) - payment.amount)
  const { error: balanceError } = await supabase
    .from("accounts")
    .update({
      balance: nextBalance,
      last_updated: payment.paidOn,
    })
    .eq("id", card.account_id)

  if (balanceError) {
    await supabase
      .from("credit_card_payments")
      .delete()
      .eq("id", recordedPayment.id)
    await supabase.from("transactions").delete().eq("id", ledgerTransaction.id)
    throw balanceError
  }

  if (payment.sourceAccountId !== card.account_id) {
    await adjustPaymentSourceBalance(
      supabase,
      payment.sourceAccountId,
      -payment.amount,
      payment.paidOn
    )
  }

  revalidateCreditCards()
}

export async function deletePayment(id: string) {
  const supabase = await createClient()

  const { data: existing, error: paymentLookupError } = await supabase
    .from("credit_card_payments")
    .select("credit_card_id, source_account_id, amount, paid_on, transaction_id")
    .eq("id", id)
    .single()
  if (paymentLookupError) throw paymentLookupError

  const { data: card, error: cardError } = await supabase
    .from("credit_cards")
    .select("account_id")
    .eq("id", existing.credit_card_id)
    .single()
  if (cardError) throw cardError

  const { data: account, error: accountError } = await supabase
    .from("accounts")
    .select("balance")
    .eq("id", card.account_id)
    .single()
  if (accountError) throw accountError

  const { error: deleteError } = await supabase
    .from("credit_card_payments")
    .delete()
    .eq("id", id)
  if (deleteError) throw deleteError

  if (existing.transaction_id) {
    await supabase.from("transactions").delete().eq("id", existing.transaction_id)
  }

  await supabase
    .from("accounts")
    .update({
      balance: Number(account.balance) + Number(existing.amount),
      last_updated: existing.paid_on,
    })
    .eq("id", card.account_id)

  if (
    existing.source_account_id &&
    existing.source_account_id !== card.account_id
  ) {
    await adjustPaymentSourceBalance(
      supabase,
      existing.source_account_id,
      Number(existing.amount),
      existing.paid_on
    )
  }

  revalidateCreditCards()
}

export async function updatePayment(
  id: string,
  payment: Omit<CreditCardPayment, "id">
) {
  const supabase = await createClient()

  const { data: existing, error: paymentLookupError } = await supabase
    .from("credit_card_payments")
    .select("credit_card_id, source_account_id, amount, paid_on, notes, transaction_id")
    .eq("id", id)
    .single()
  if (paymentLookupError) throw paymentLookupError

  const { data: card, error: cardError } = await supabase
    .from("credit_cards")
    .select("account_id, accounts(name)")
    .eq("id", existing.credit_card_id)
    .single()
  if (cardError) throw cardError

  const { data: account, error: accountError } = await supabase
    .from("accounts")
    .select("balance")
    .eq("id", card.account_id)
    .single()
  if (accountError) throw accountError

  const { error: paymentError } = await supabase
    .from("credit_card_payments")
    .update({
      source_account_id: payment.sourceAccountId,
      amount: payment.amount,
      paid_on: payment.paidOn,
      notes: payment.notes || null,
    })
    .eq("id", id)
  if (paymentError) throw paymentError

  if (existing.transaction_id) {
    const cardAccount = card.accounts as unknown as { name: string } | null
    const { error: transactionError } = await supabase
      .from("transactions")
      .update({
        date: payment.paidOn,
        description: `Payment to ${cardAccount?.name ?? "credit card"}`,
        account_id: payment.sourceAccountId,
        amount: payment.amount,
        notes: payment.notes || null,
      })
      .eq("id", existing.transaction_id)
    if (transactionError) throw transactionError
  }

  const nextBalance = Math.max(
    0,
    Number(account.balance) + Number(existing.amount) - payment.amount
  )
  const { error: balanceError } = await supabase
    .from("accounts")
    .update({
      balance: nextBalance,
      last_updated: payment.paidOn,
    })
    .eq("id", card.account_id)

  if (balanceError) {
    await supabase
      .from("credit_card_payments")
      .update({
        source_account_id: existing.source_account_id,
        amount: existing.amount,
        paid_on: existing.paid_on,
        notes: existing.notes,
      })
      .eq("id", id)
    throw balanceError
  }

  if (
    existing.source_account_id &&
    existing.source_account_id !== card.account_id
  ) {
    await adjustPaymentSourceBalance(
      supabase,
      existing.source_account_id,
      Number(existing.amount),
      payment.paidOn
    )
  }
  if (
    payment.sourceAccountId &&
    payment.sourceAccountId !== card.account_id
  ) {
    await adjustPaymentSourceBalance(
      supabase,
      payment.sourceAccountId,
      -payment.amount,
      payment.paidOn
    )
  }

  revalidateCreditCards()
}
