"use client"

import { CreditCardIcon, Pencil, Plus, Trash2 } from "lucide-react"

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

export function CreditCardDetailSheet({
  card,
  payments,
  open,
  onOpenChange,
  onEdit,
  onDelete,
  onRecordPayment,
}: {
  card: CreditCard | null
  payments: CreditCardPayment[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onEdit: (card: CreditCard) => void
  onDelete: (id: string) => void
  onRecordPayment: (card: CreditCard) => void
}) {
  const { format } = useCurrency()
  const today = new Date()

  const cardPayments = card
    ? payments
        .filter((p) => p.creditCardId === card.id)
        .sort((a, b) => (a.paidOn < b.paidOn ? 1 : -1))
    : []

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
                      <span className="font-medium tabular-nums text-emerald-600 dark:text-emerald-400">
                        {format(payment.amount)}
                      </span>
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
