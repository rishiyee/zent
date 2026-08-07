"use client"

import { CheckCircle2, Pencil, Trash2 } from "lucide-react"

import { Transaction, TransactionAccountOption, accountName } from "@/lib/transactions"
import { useCurrency } from "@/components/currency-provider"
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
import { TransactionStatusBadge } from "@/components/transactions/transaction-status-badge"

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  weekday: "long",
  month: "long",
  day: "numeric",
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

export function TransactionDetailSheet({
  transaction,
  open,
  onOpenChange,
  onEdit,
  onDelete,
  onMarkReviewed,
  accounts,
}: {
  transaction: Transaction | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onEdit: (transaction: Transaction) => void
  onDelete: (id: string) => void
  onMarkReviewed: (id: string) => void
  accounts: TransactionAccountOption[]
}) {
  const { format } = useCurrency()
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        {transaction && (
          <>
            <SheetHeader>
              <SheetTitle>{transaction.description}</SheetTitle>
              <SheetDescription>
                {dateFormatter.format(new Date(`${transaction.date}T00:00:00`))}
              </SheetDescription>
            </SheetHeader>
            <div className="flex flex-col px-4">
              <div
                className={`text-3xl font-semibold tabular-nums ${
                  transaction.type === "income"
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-foreground"
                }`}
              >
                {transaction.type === "income" ? "+" : "-"}
                {format(transaction.amount)}
              </div>
              <Separator className="my-3" />
              <DetailRow label="Status">
                <TransactionStatusBadge status={transaction.status} />
              </DetailRow>
              <DetailRow label="Category">
                {transaction.linkedPaymentId ? (
                  <Badge variant="outline" className="font-normal">
                    Transfer
                  </Badge>
                ) : transaction.category ? (
                  <Badge variant="secondary" className="font-normal">
                    {transaction.category}
                  </Badge>
                ) : (
                  <Badge variant="outline" className="font-normal text-muted-foreground">
                    Uncategorized
                  </Badge>
                )}
              </DetailRow>
              <DetailRow label="Account">
                {accountName(transaction.accountId, accounts)}
              </DetailRow>
              <DetailRow label="Source">
                <span className="capitalize">{transaction.source}</span>
              </DetailRow>
              {transaction.notes && (
                <>
                  <Separator className="my-3" />
                  <div className="flex flex-col gap-1">
                    <span className="text-sm text-muted-foreground">Notes</span>
                    <p className="text-sm">{transaction.notes}</p>
                  </div>
                </>
              )}
            </div>
            <SheetFooter>
              {transaction.status !== "reviewed" && (
                <Button
                  variant="outline"
                  onClick={() => onMarkReviewed(transaction.id)}
                >
                  <CheckCircle2 />
                  Mark as reviewed
                </Button>
              )}
              {!transaction.linkedPaymentId && <Button onClick={() => onEdit(transaction)}>
                <Pencil />
                Edit transaction
              </Button>}
              {!transaction.linkedPaymentId && <Button
                variant="ghost"
                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                onClick={() => {
                  onDelete(transaction.id)
                  onOpenChange(false)
                }}
              >
                <Trash2 />
                Delete transaction
              </Button>}
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
