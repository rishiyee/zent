import { createClient } from "@/lib/supabase/server"
import { CreditCard, CreditCardPayment, MinimumPaymentType } from "@/lib/credit-cards"

type CreditCardRow = {
  id: string
  account_id: string
  credit_limit: number
  apr: number | null
  statement_day: number
  payment_due_day: number
  minimum_payment_type: MinimumPaymentType
  minimum_payment_value: number
  autopay: boolean
  accounts: { name: string; balance: number } | null
}

type CreditCardPaymentRow = {
  id: string
  credit_card_id: string
  amount: number
  paid_on: string
  source_account_id: string | null
  notes: string | null
}

function toCreditCard(row: CreditCardRow): CreditCard {
  return {
    id: row.id,
    accountId: row.account_id,
    name: row.accounts?.name ?? "",
    balance: Number(row.accounts?.balance ?? 0),
    creditLimit: Number(row.credit_limit),
    apr: row.apr != null ? Number(row.apr) : null,
    statementDay: row.statement_day,
    paymentDueDay: row.payment_due_day,
    minimumPaymentType: row.minimum_payment_type,
    minimumPaymentValue: Number(row.minimum_payment_value),
    autopay: row.autopay,
  }
}

function toCreditCardPayment(row: CreditCardPaymentRow): CreditCardPayment {
  return {
    id: row.id,
    creditCardId: row.credit_card_id,
    amount: Number(row.amount),
    paidOn: row.paid_on,
    sourceAccountId: row.source_account_id,
    notes: row.notes ?? "",
  }
}

export async function getCreditCards(): Promise<CreditCard[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("credit_cards")
    .select(
      "id, account_id, credit_limit, apr, statement_day, payment_due_day, minimum_payment_type, minimum_payment_value, autopay, accounts(name, balance)"
    )
    .order("created_at", { ascending: true })

  if (error) throw error
  return (data as unknown as CreditCardRow[]).map(toCreditCard)
}

export async function getCreditCardPayments(): Promise<CreditCardPayment[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("credit_card_payments")
    .select("id, credit_card_id, amount, paid_on, source_account_id, notes")
    .order("paid_on", { ascending: false })

  if (error) throw error
  return (data as CreditCardPaymentRow[]).map(toCreditCardPayment)
}
