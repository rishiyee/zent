"use client"

import * as React from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { CreditCard as CreditCardIcon, Plus } from "lucide-react"

import {
  addCreditCard,
  addPayment,
  deleteCreditCard,
  deletePayment,
  getCreditCardsData,
  updateCreditCard,
  updatePayment,
} from "@/app/(dashboard)/credit-cards/actions"
import { getTransactionsData } from "@/app/(dashboard)/transactions/actions"
import {
  CreditCard,
  CreditCardPayment,
  daysUntilDue,
  dueStatus,
  dueStatusMeta,
  isCycleSettled,
  nextDueDate,
  utilization,
} from "@/lib/credit-cards"
import { queryKeys } from "@/lib/query-keys"
import { Transaction, TransactionAccountOption } from "@/lib/transactions"
import { cn } from "@/lib/utils"
import { useCurrency } from "@/components/currency-provider"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { notify } from "@/components/ui/toast"
import { AddCreditCardDrawer } from "@/components/credit-cards/add-credit-card-drawer"
import { CreditCardDetailSheet } from "@/components/credit-cards/credit-card-detail-sheet"
import { EditCreditCardDrawer } from "@/components/credit-cards/edit-credit-card-drawer"
import { RecordPaymentDrawer } from "@/components/credit-cards/record-payment-drawer"

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
})

function UtilizationBar({ value }: { value: number }) {
  const pct = Math.round(value * 100)
  const color =
    pct >= 90
      ? "bg-destructive"
      : pct >= 60
        ? "bg-amber-500"
        : "bg-emerald-500"

  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-24 overflow-hidden rounded-full bg-muted">
        <div
          className={cn("h-full rounded-full", color)}
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>
      <span className="text-xs text-muted-foreground tabular-nums">{pct}%</span>
    </div>
  )
}

export function CreditCardsView({
  cards: initialCards,
  payments: initialPayments,
  transactions: initialTransactions,
  accounts,
}: {
  cards: CreditCard[]
  payments: CreditCardPayment[]
  transactions: Transaction[]
  accounts: TransactionAccountOption[]
}) {
  const { format } = useCurrency()
  const queryClient = useQueryClient()
  const { data } = useQuery({
    queryKey: queryKeys.creditCards,
    queryFn: getCreditCardsData,
    initialData: { cards: initialCards, payments: initialPayments },
  })
  const { cards: storedCards, payments } = data
  const { data: transactions } = useQuery({
    queryKey: queryKeys.transactions,
    queryFn: getTransactionsData,
    initialData: initialTransactions,
  })
  const cards = React.useMemo(
    () =>
      storedCards.map((card) => {
        const ledgerBalance = transactions
          .filter((transaction) => transaction.accountId === card.accountId)
          .reduce(
            (balance, transaction) =>
              balance +
              (transaction.type === "expense"
                ? transaction.amount
                : -transaction.amount),
            0
          )
        const paid = payments
          .filter((payment) => payment.creditCardId === card.id)
          .reduce((total, payment) => total + payment.amount, 0)

        return { ...card, balance: Math.max(0, ledgerBalance - paid) }
      }),
    [storedCards, transactions, payments]
  )
  const [detailId, setDetailId] = React.useState<string | null>(null)
  const [editId, setEditId] = React.useState<string | null>(null)
  const [paymentCardId, setPaymentCardId] = React.useState<string | null>(null)
  const [editPaymentId, setEditPaymentId] = React.useState<string | null>(null)

  const today = React.useMemo(() => new Date(), [])

  const detailCard = cards.find((c) => c.id === detailId) ?? null
  const editCard = cards.find((c) => c.id === editId) ?? null
  const paymentCard = cards.find((c) => c.id === paymentCardId) ?? null
  const editPayment = payments.find((p) => p.id === editPaymentId) ?? null
  const editPaymentCard = cards.find((c) => c.id === editPayment?.creditCardId) ?? null

  const totalBalance = cards.reduce((sum, c) => sum + c.balance, 0)
  const totalLimit = cards.reduce((sum, c) => sum + c.creditLimit, 0)
  const blendedUtilization = totalLimit > 0 ? totalBalance / totalLimit : 0

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: queryKeys.creditCards })
    queryClient.invalidateQueries({ queryKey: queryKeys.transactions })
    queryClient.invalidateQueries({ queryKey: queryKeys.accounts })
  }

  function addCard(card: Omit<CreditCard, "id" | "accountId">) {
    void notify(addCreditCard(card), "Credit card added").then(invalidate)
  }

  function saveCard(id: string, patch: Omit<CreditCard, "id" | "accountId">) {
    const card = cards.find((c) => c.id === id)
    if (!card) return
    void notify(updateCreditCard(id, card.accountId, patch), "Credit card updated").then(
      invalidate
    )
  }

  function deleteCard(id: string) {
    const card = cards.find((c) => c.id === id)
    if (!card) return
    void notify(deleteCreditCard(card.accountId), "Credit card deleted").then(invalidate)
  }

  function recordPayment(payment: Omit<CreditCardPayment, "id">) {
    void notify(addPayment(payment), "Payment recorded").then(invalidate)
  }

  function savePayment(
    id: string,
    payment: Omit<CreditCardPayment, "id">
  ) {
    void notify(updatePayment(id, payment), "Payment updated").then(invalidate)
  }

  function removePayment(id: string) {
    void notify(deletePayment(id), "Payment deleted").then(invalidate)
  }

  function openEdit(card: CreditCard) {
    setDetailId(null)
    setEditId(card.id)
  }

  function openRecordPayment(card: CreditCard) {
    setEditPaymentId(null)
    setPaymentCardId(card.id)
  }

  function openEditPayment(payment: CreditCardPayment) {
    setEditPaymentId(payment.id)
    setPaymentCardId(null)
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardDescription>Total outstanding balance</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums">
              {format(totalBalance)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Total credit limit</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums">
              {format(totalLimit)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Blended utilization</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums">
              {(blendedUtilization * 100).toFixed(0)}%
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div>
        <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-lg font-medium">Credit cards</h2>
            <p className="text-sm text-muted-foreground">
              Click a card for details, payment history, and to record a
              payment.
            </p>
          </div>
          <AddCreditCardDrawer onAdd={addCard} />
        </div>

        {cards.length ? (
          <div className="flex flex-col gap-3">
            {cards.map((card) => {
              const settled = isCycleSettled(card, payments, today)
              const daysUntil = daysUntilDue(card, today)
              const status = dueStatus(daysUntil, settled)
              return (
                <div
                  key={card.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => setDetailId(card.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") setDetailId(card.id)
                  }}
                  className="grid cursor-pointer grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-lg border p-3 text-left hover:bg-muted/50 sm:flex sm:gap-4 sm:p-4"
                >
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted">
                    <CreditCardIcon className="size-4 text-muted-foreground" />
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <span className="font-medium">{card.name}</span>
                    <UtilizationBar value={utilization(card)} />
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="font-medium tabular-nums">
                      {format(card.balance)}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      of {format(card.creditLimit)}
                    </span>
                  </div>
                  <div className="col-span-2 col-start-2 flex flex-row items-center justify-between gap-2 sm:col-auto sm:w-36 sm:flex-col sm:items-end">
                    <Badge variant="outline" className={dueStatusMeta[status].className}>
                      {dueStatusMeta[status].label}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      Due {dateFormatter.format(nextDueDate(card, today))}
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="col-start-3 row-start-2 sm:col-auto sm:row-auto"
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      openRecordPayment(card)
                    }}
                  >
                    <Plus />
                    Pay
                  </Button>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="rounded-lg border p-8 text-center text-sm text-muted-foreground">
            No credit cards yet. Add one to start tracking due dates and
            payments.
          </div>
        )}
      </div>

      <CreditCardDetailSheet
        card={detailCard}
        payments={payments}
        transactions={transactions}
        open={!!detailId}
        onOpenChange={(open) => !open && setDetailId(null)}
        onEdit={openEdit}
        onDelete={deleteCard}
        onRecordPayment={openRecordPayment}
        onEditPayment={openEditPayment}
        onDeletePayment={removePayment}
      />
      <EditCreditCardDrawer
        card={editCard}
        open={!!editId}
        onOpenChange={(open) => !open && setEditId(null)}
        onSave={saveCard}
      />
      <RecordPaymentDrawer
        card={paymentCard}
        open={!!paymentCardId}
        onOpenChange={(open) => !open && setPaymentCardId(null)}
        accounts={accounts}
        onRecord={recordPayment}
      />
      <RecordPaymentDrawer
        card={editPaymentCard}
        payment={editPayment}
        open={!!editPaymentId}
        onOpenChange={(open) => !open && setEditPaymentId(null)}
        accounts={accounts}
        onRecord={recordPayment}
        onUpdate={savePayment}
      />
    </div>
  )
}
