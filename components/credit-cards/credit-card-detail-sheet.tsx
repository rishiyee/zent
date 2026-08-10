"use client"

import * as React from "react"
import Link from "next/link"
import { ChevronDown, CreditCardIcon, Pencil, Plus, ReceiptText, Trash2 } from "lucide-react"

import {
  CreditCard,
  CreditCardPayment,
  daysUntilDue,
  dueStatus,
  dueStatusMeta,
  isCycleSettled,
  minimumPaymentAmount,
  nextDueDate,
  utilization,
} from "@/lib/credit-cards"
import { Transaction } from "@/lib/transactions"
import { useCurrency } from "@/components/currency-provider"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "long",
  day: "numeric",
  year: "numeric",
})

const monthFormatter = new Intl.DateTimeFormat("en-US", {
  month: "long",
  year: "numeric",
})

function DetailRow({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-2 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{children}</span>
    </div>
  )
}

function MonthlyTransactionsAccordion({
  month,
  items,
  total,
  format,
}: {
  month: string
  items: Transaction[]
  total: number
  format: (amount: number) => string
}) {
  const [open, setOpen] = React.useState(false)

  return (
    <div className="rounded-md border">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className="flex w-full cursor-pointer items-center justify-between gap-3 px-3 py-2 text-left text-sm"
      >
        <div className="flex items-center gap-2">
          <ChevronDown
            className={`size-4 transition-transform duration-300 ease-out ${
              open ? "rotate-180" : ""
            }`}
          />
          <span className="font-medium">
            {monthFormatter.format(new Date(`${month}-01T00:00:00`))}
          </span>
          <span className="text-xs text-muted-foreground">
            {items.length} transaction{items.length === 1 ? "" : "s"}
          </span>
        </div>
        <span className="font-medium tabular-nums">{format(total)}</span>
      </button>
      <div
        className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out ${
          open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden">
          <div className="border-t px-3">
            {items.map((txn) => (
              <div
                key={txn.id}
                className="flex items-center justify-between gap-2 border-b py-2 text-sm last:border-b-0"
              >
                <div className="flex min-w-0 flex-col">
                  <span className="truncate font-medium">{txn.description}</span>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span>
                      {dateFormatter.format(new Date(`${txn.date}T00:00:00`))}
                    </span>
                    {txn.category && (
                      <Badge variant="secondary" className="h-4 px-1.5 font-normal">
                        {txn.category}
                      </Badge>
                    )}
                  </div>
                </div>
                <span className="shrink-0 font-medium tabular-nums">
                  {txn.type === "income" ? "+" : "-"}
                  {format(txn.amount)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export function CreditCardDetailSheet({
  card,
  payments,
  transactions,
  open,
  onOpenChange,
  onEdit,
  onDelete,
  onRecordPayment,
  onEditPayment,
  onDeletePayment,
}: {
  card: CreditCard | null
  payments: CreditCardPayment[]
  transactions: Transaction[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onEdit: (card: CreditCard) => void
  onDelete: (id: string) => void
  onRecordPayment: (card: CreditCard) => void
  onEditPayment: (payment: CreditCardPayment) => void
  onDeletePayment: (id: string) => void
}) {
  const { format } = useCurrency()
  const today = new Date()

  const cardPayments = card
    ? payments
        .filter((p) => p.creditCardId === card.id)
        .sort((a, b) => (a.paidOn < b.paidOn ? 1 : -1))
    : []

  const cardTransactions = card
    ? transactions
        .filter((t) => t.accountId === card.accountId)
        .sort((a, b) => (a.date < b.date ? 1 : -1))
    : []

  const monthlyTransactions = Array.from(
    cardTransactions.reduce((groups, transaction) => {
      const month = transaction.date.slice(0, 7)
      const existing = groups.get(month)
      if (existing) existing.push(transaction)
      else groups.set(month, [transaction])
      return groups
    }, new Map<string, Transaction[]>())
  ).map(([month, items]) => ({
    month,
    items,
    total: items.reduce(
      (sum, transaction) =>
        sum + (transaction.type === "income" ? -transaction.amount : transaction.amount),
      0
    ),
  }))

  const settled = card ? isCycleSettled(card, payments, today) : false
  const daysUntil = card ? daysUntilDue(card, today) : 0
  const status = card ? dueStatus(daysUntil, settled) : "ok"

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        {card && (
          <>
            <SheetHeader>
              <SheetTitle>{card.name}</SheetTitle>
              <SheetDescription>
                {(utilization(card) * 100).toFixed(0)}% utilized ·{" "}
                {format(card.creditLimit)} limit
              </SheetDescription>
            </SheetHeader>
            <div className="flex flex-col px-4">
              <div className="text-3xl font-semibold tabular-nums">
                {format(card.balance)}
              </div>
              <Separator className="my-3" />
              <DetailRow label="Status">
                <Badge variant="outline" className={dueStatusMeta[status].className}>
                  {dueStatusMeta[status].label}
                </Badge>
              </DetailRow>
              <DetailRow label="Next due date">
                {dateFormatter.format(nextDueDate(card, today))}
              </DetailRow>
              <DetailRow label="Minimum payment">
                {format(minimumPaymentAmount(card))}
              </DetailRow>
              <DetailRow label="APR">
                {card.apr != null ? `${card.apr}%` : "Not set"}
              </DetailRow>
              <DetailRow label="Autopay">
                {card.autopay ? "On" : "Off"}
              </DetailRow>

              <Separator className="my-3" />
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-medium">Transactions</span>
                <Button
                  variant="ghost"
                  size="sm"
                  nativeButton={false}
                  render={<Link href="/transactions" />}
                >
                  View all
                </Button>
              </div>
              <div className="flex max-h-72 flex-col gap-1 overflow-y-auto">
                {monthlyTransactions.length ? (
                  monthlyTransactions.map((group) => (
                    <MonthlyTransactionsAccordion
                      key={group.month}
                      month={group.month}
                      items={group.items}
                      total={group.total}
                      format={format}
                    />
                  ))
                ) : (
                  <p className="py-4 text-center text-sm text-muted-foreground">
                    <ReceiptText className="mx-auto mb-1.5 size-5 text-muted-foreground/50" />
                    No transactions on this card yet.
                  </p>
                )}
              </div>

              <Separator className="my-3" />
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-medium">Payment history</span>
                <Button
                  variant="outline"
                  size="sm"
                  type="button"
                  onClick={() => onRecordPayment(card)}
                >
                  <Plus />
                  Record payment
                </Button>
              </div>
              <div className="flex flex-col">
                {cardPayments.length ? (
                  cardPayments.map((payment) => (
                    <div
                      key={payment.id}
                      className="flex items-center justify-between border-b py-2 text-sm last:border-b-0"
                    >
                      <div className="flex flex-col">
                        <span className="font-medium">
                          {dateFormatter.format(new Date(`${payment.paidOn}T00:00:00`))}
                        </span>
                        {payment.notes && (
                          <span className="text-xs text-muted-foreground">
                            {payment.notes}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="font-medium tabular-nums text-emerald-600 dark:text-emerald-400">
                          {format(payment.amount)}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          type="button"
                          aria-label="Edit payment"
                          onClick={() => onEditPayment(payment)}
                        >
                          <Pencil />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger
                            render={
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                type="button"
                                aria-label="Delete payment"
                                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                              />
                            }
                          >
                            <Trash2 />
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete this payment?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This removes the {format(payment.amount)} payment
                                and its linked ledger transaction, and restores
                                the card balance. This can&apos;t be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                variant="destructive"
                                onClick={() => onDeletePayment(payment.id)}
                              >
                                Delete payment
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="py-4 text-center text-sm text-muted-foreground">
                    <CreditCardIcon className="mx-auto mb-1.5 size-5 text-muted-foreground/50" />
                    No payments recorded yet.
                  </p>
                )}
              </div>
            </div>
            <SheetFooter>
              <Button onClick={() => onEdit(card)}>
                <Pencil />
                Edit card
              </Button>
              <AlertDialog>
                <AlertDialogTrigger
                  render={
                    <Button
                      variant="ghost"
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                    />
                  }
                >
                  <Trash2 />
                  Delete card
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      Delete &ldquo;{card.name}&rdquo;?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      This removes the card and its {cardPayments.length}{" "}
                      recorded payment{cardPayments.length === 1 ? "" : "s"}.
                      This can&apos;t be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      variant="destructive"
                      onClick={() => {
                        onDelete(card.id)
                        onOpenChange(false)
                      }}
                    >
                      Delete card
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
