"use client"

import * as React from "react"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"

import { CreditCard, CreditCardPayment } from "@/lib/credit-cards"
import { TransactionAccountOption, transactionAccountOptions } from "@/lib/transactions"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

export function RecordPaymentDrawer({
  card,
  open,
  onOpenChange,
  accounts,
  onRecord,
}: {
  card: CreditCard | null
  open: boolean
  onOpenChange: (open: boolean) => void
  accounts: TransactionAccountOption[]
  onRecord: (payment: Omit<CreditCardPayment, "id">) => void
}) {
  const [amount, setAmount] = React.useState("")
  const [date, setDate] = React.useState<Date | undefined>(new Date())
  const [sourceAccountId, setSourceAccountId] = React.useState("CASH")
  const [notes, setNotes] = React.useState("")
  const [wasOpen, setWasOpen] = React.useState(open)

  if (open !== wasOpen) {
    setWasOpen(open)
    if (open) {
      setAmount("")
      setDate(new Date())
      setSourceAccountId(accounts[0]?.id ?? "CASH")
      setNotes("")
    }
  }

  const parsedAmount = Number.parseFloat(amount)
  const canSubmit = !!card && !Number.isNaN(parsedAmount) && parsedAmount > 0 && !!date

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (!card || !canSubmit || !date) return

    onRecord({
      creditCardId: card.id,
      amount: parsedAmount,
      paidOn: format(date, "yyyy-MM-dd"),
      sourceAccountId: sourceAccountId === "CASH" ? null : sourceAccountId,
      notes: notes.trim(),
    })
    onOpenChange(false)
  }

  return (
    <Drawer open={open} swipeDirection="right" onOpenChange={onOpenChange}>
      <DrawerContent>
        {card && (
          <form onSubmit={handleSubmit} className="flex h-full flex-col">
            <DrawerHeader>
              <DrawerTitle>Record payment</DrawerTitle>
              <DrawerDescription>
                Log a payment made toward {card.name}. The card&apos;s outstanding
                balance and utilization will update automatically.
              </DrawerDescription>
            </DrawerHeader>
            <div className="flex flex-col gap-4 overflow-y-auto p-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="payment-amount">Amount</Label>
                  <Input
                    id="payment-amount"
                    type="number"
                    inputMode="decimal"
                    min="0.01"
                    step="0.01"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                    autoFocus
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="payment-date">Date</Label>
                  <Popover>
                    <PopoverTrigger
                      render={
                        <Button
                          id="payment-date"
                          type="button"
                          variant="outline"
                          className={cn(
                            "w-full justify-start font-normal",
                            !date && "text-muted-foreground"
                          )}
                        />
                      }
                    >
                      <CalendarIcon />
                      {date ? format(date, "PPP") : "Today"}
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={date}
                        onSelect={setDate}
                        autoFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Label>Pay from</Label>
                <Select
                  items={Object.fromEntries(
                    transactionAccountOptions(accounts).map((a) => [a.id, a.name])
                  )}
                  value={sourceAccountId}
                  onValueChange={(v) => v && setSourceAccountId(v)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {transactionAccountOptions(accounts).map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="payment-notes">Notes (optional)</Label>
                <Textarea
                  id="payment-notes"
                  placeholder="Any extra detail for this payment"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                />
              </div>
            </div>
            <DrawerFooter>
              <Button type="submit" disabled={!canSubmit}>
                Record payment
              </Button>
              <DrawerClose render={<Button variant="outline" type="button" />}>
                Cancel
              </DrawerClose>
            </DrawerFooter>
          </form>
        )}
      </DrawerContent>
    </Drawer>
  )
}
